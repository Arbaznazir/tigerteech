package db

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"strings"

	_ "github.com/jackc/pgx/v5/stdlib"
)

//go:embed migrations/*.sql
var migrationFS embed.FS

func Connect(databaseURL string) (*sql.DB, error) {
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(5)
	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}
	return db, nil
}

func Migrate(ctx context.Context, db *sql.DB) error {
	if _, err := db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`); err != nil {
		return err
	}

	versions := []string{
		"001_init",
		"002_variant_material",
		"003_inventory",
		"004_product_meta",
		"005_deal_banner",
		"006_orders_users",
		"007_order_status_indexes",
		"008_product_search_indexes",
		"009_promotions",
		"010_promo_usage_limits",
		"011_user_measurements",
		"012_user_gender",
		"013_support",
		"014_notifications_order",
		"015_support_admin_unread",
		"016_support_reopen",
		"017_platform_settings",
		"018_deal_geo",
		"019_promo_card_style",
	}
	for _, version := range versions {
		var applied bool
		if err := db.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version=$1)`, version).Scan(&applied); err != nil {
			return err
		}
		if applied {
			continue
		}

		raw, err := migrationFS.ReadFile("migrations/" + version + ".sql")
		if err != nil {
			return err
		}

		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}

		sqlText := string(raw)
		if version == "001_init" {
			sqlText = strings.Replace(sqlText, `CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

`, "", 1)
		}

		if _, err := tx.ExecContext(ctx, sqlText); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("apply %s: %w", version, err)
		}
		if _, err := tx.ExecContext(ctx, `INSERT INTO schema_migrations(version) VALUES ($1)`, version); err != nil {
			_ = tx.Rollback()
			return err
		}
		if err := tx.Commit(); err != nil {
			return err
		}
	}
	return nil
}

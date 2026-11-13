// Seed demo catalog data into Postgres / Supabase.
//
//	DATABASE_URL=... go run ./cmd/seed
//
// Runs backend/seed/demo_seed.sql (idempotent). Migrations + admin user are
// created by the API on boot — start the API once before seeding a fresh DB.
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/joho/godotenv"

	"github.com/tigerteeh/tigerteehcloothing/backend/internal/config"
	"github.com/tigerteeh/tigerteehcloothing/backend/internal/db"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer database.Close()

	seedPath := filepath.Join("seed", "demo_seed.sql")
	if abs, err := filepath.Abs(seedPath); err == nil {
		seedPath = abs
	}
	raw, err := os.ReadFile(seedPath)
	if err != nil {
		// When run from repo root: backend/seed/...
		alt := filepath.Join("backend", "seed", "demo_seed.sql")
		raw, err = os.ReadFile(alt)
		if err != nil {
			log.Fatalf("read seed file: %v (tried %s and %s)", err, seedPath, alt)
		}
		seedPath = alt
	}

	if _, err := database.ExecContext(ctx, string(raw)); err != nil {
		log.Fatalf("seed exec: %v", err)
	}

	fmt.Printf("Seeded demo data from %s\n", seedPath)
}

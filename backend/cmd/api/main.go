package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"github.com/tigerteeh/tigerteehcloothing/backend/internal/auth"
	"github.com/tigerteeh/tigerteehcloothing/backend/internal/catalog"
	"github.com/tigerteeh/tigerteehcloothing/backend/internal/config"
	"github.com/tigerteeh/tigerteehcloothing/backend/internal/db"
	"github.com/tigerteeh/tigerteehcloothing/backend/internal/emailguard"
	"github.com/tigerteeh/tigerteehcloothing/backend/internal/httpapi"
	"github.com/tigerteeh/tigerteehcloothing/backend/internal/marketing"
	"github.com/tigerteeh/tigerteehcloothing/backend/internal/media"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	if abs, err := filepath.Abs(cfg.UploadDir); err == nil {
		cfg.UploadDir = abs
	}

	ctx := context.Background()
	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer database.Close()

	if err := db.Migrate(ctx, database); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	authSvc := &auth.Service{DB: database, Secret: []byte(cfg.JWTSecret), TTL: 24 * time.Hour}
	if err := authSvc.EnsureAdmin(ctx, cfg.AdminEmail, cfg.AdminPassword, "Tigerteeh Admin"); err != nil {
		log.Fatalf("seed admin: %v", err)
	}

	cat := &catalog.Store{DB: database}
	if err := cat.EnsureDefaultTags(ctx); err != nil {
		log.Fatalf("seed tags: %v", err)
	}
	if err := cat.EnsureDefaultDetailFields(ctx); err != nil {
		log.Fatalf("seed detail fields: %v", err)
	}

	mkt := &marketing.Store{DB: database}
	if err := mkt.EnsureSlots(ctx); err != nil {
		log.Fatalf("seed banner slots: %v", err)
	}

	mediaSvc := &media.Service{
		UploadDir:     cfg.UploadDir,
		PublicBaseURL: cfg.PublicBaseURL,
		Quality:       cfg.WebPQuality,
	}
	if err := mediaSvc.EnsureDir(); err != nil {
		log.Fatalf("uploads dir: %v", err)
	}

	seedBannersDir := filepath.Join(filepath.Dir(cfg.UploadDir), "seed", "banners")
	if _, err := os.Stat(seedBannersDir); err != nil {
		// Prefer backend/seed/banners next to the module root when UploadDir is absolute.
		if wd, wdErr := os.Getwd(); wdErr == nil {
			seedBannersDir = filepath.Join(wd, "seed", "banners")
		}
	}
	if err := mkt.EnsureDefaultBanners(ctx, cfg.UploadDir, cfg.PublicBaseURL, seedBannersDir); err != nil {
		log.Fatalf("seed default banners: %v", err)
	}
	if err := mkt.LockDefaultBanners(ctx); err != nil {
		log.Fatalf("lock default banners: %v", err)
	}

	emailGuard := emailguard.New()
	refreshCtx, refreshCancel := context.WithCancel(context.Background())
	defer refreshCancel()
	emailGuard.StartRefresh(refreshCtx)

	api := &httpapi.API{
		Cfg:    cfg,
		Auth:   authSvc,
		Cat:    cat,
		Mkt:    mkt,
		Media:  mediaSvc,
		Emails: emailGuard,
		DB:     database,
	}

	srv := &http.Server{
		Addr:              cfg.Addr,
		Handler:           httpapi.NewRouter(api),
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("Tigerteeh API on http://localhost%s", cfg.Addr)
		log.Printf("Admin login: %s", cfg.AdminEmail)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	refreshCancel()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}

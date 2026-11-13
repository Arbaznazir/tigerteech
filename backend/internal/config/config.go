package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Addr           string
	DatabaseURL    string
	JWTSecret      string
	UploadDir      string
	PublicBaseURL  string
	AdminEmail     string
	AdminPassword  string
	AllowedOrigins []string
	WebPQuality    int
}

func Load() Config {
	quality, _ := strconv.Atoi(getenv("WEBP_QUALITY", "82"))
	if quality <= 0 || quality > 100 {
		quality = 82
	}

	origins := []string{
		"http://localhost:3000",
		"http://localhost:3001",
		"http://localhost:8080",
		"http://127.0.0.1:3000",
		"http://127.0.0.1:3001",
		"http://127.0.0.1:8080",
	}
	origins = append(origins, splitCSV(getenv("STOREFRONT_ORIGIN", ""))...)
	origins = append(origins, splitCSV(getenv("ADMIN_ORIGIN", ""))...)
	origins = append(origins, splitCSV(getenv("CORS_ORIGINS", ""))...)

	return Config{
		Addr:           getenv("ADDR", ":4000"),
		DatabaseURL:    getenv("DATABASE_URL", "postgres://tigerteeh:tigerteeh@127.0.0.1:5432/tigerteeh?sslmode=disable"),
		JWTSecret:      getenv("JWT_SECRET", "tigerteeh-dev-secret-change-me"),
		UploadDir:      getenv("UPLOAD_DIR", "uploads"),
		PublicBaseURL:  getenv("PUBLIC_BASE_URL", "http://localhost:4000"),
		AdminEmail:     getenv("ADMIN_EMAIL", "admin@tigerteehclothing.com"),
		AdminPassword:  getenv("ADMIN_PASSWORD", "TigerteehAdmin1!"),
		AllowedOrigins: origins,
		WebPQuality:    quality,
	}
}

func splitCSV(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(strings.TrimRight(p, "/"))
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

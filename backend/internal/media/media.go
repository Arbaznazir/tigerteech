package media

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	UploadDir     string
	PublicBaseURL string
	Quality       int
}

func (s *Service) EnsureDir() error {
	return os.MkdirAll(s.UploadDir, 0o755)
}

func (s *Service) SaveUpload(entity string, file multipart.File, header *multipart.FileHeader) (string, error) {
	if err := s.EnsureDir(); err != nil {
		return "", err
	}
	ext := strings.ToLower(filepath.Ext(header.Filename))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".webp", ".gif":
	default:
		return "", fmt.Errorf("unsupported image type: %s", ext)
	}
	if header.Size > 12<<20 {
		return "", fmt.Errorf("file too large (max 12MB)")
	}

	subdir := filepath.Join(entity, time.Now().Format("2006/01"))
	dir := filepath.Join(s.UploadDir, subdir)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}

	tmpPath := filepath.Join(dir, uuid.New().String()+ext)
	out, err := os.Create(tmpPath)
	if err != nil {
		return "", err
	}
	if _, err := io.Copy(out, file); err != nil {
		_ = out.Close()
		_ = os.Remove(tmpPath)
		return "", err
	}
	_ = out.Close()

	webpName := uuid.New().String() + ".webp"
	webpPath := filepath.Join(dir, webpName)
	quality := s.Quality
	if quality <= 0 {
		quality = 82
	}

	if ext == ".webp" {
		if err := os.Rename(tmpPath, webpPath); err != nil {
			_ = os.Remove(tmpPath)
			return "", err
		}
	} else {
		cmd := exec.Command("cwebp", "-q", fmt.Sprintf("%d", quality), tmpPath, "-o", webpPath)
		if outBytes, err := cmd.CombinedOutput(); err != nil {
			_ = os.Remove(tmpPath)
			return "", fmt.Errorf("cwebp failed: %w (%s)", err, strings.TrimSpace(string(outBytes)))
		}
		_ = os.Remove(tmpPath)
	}

	rel := filepath.ToSlash(filepath.Join(subdir, webpName))
	url := strings.TrimRight(s.PublicBaseURL, "/") + "/uploads/" + rel
	return url, nil
}

func (s *Service) Handler(defaultEntity string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseMultipartForm(12 << 20); err != nil {
			http.Error(w, `{"data":null,"error":"invalid multipart"}`, http.StatusBadRequest)
			return
		}
		file, header, err := r.FormFile("file")
		if err != nil {
			http.Error(w, `{"data":null,"error":"file required"}`, http.StatusBadRequest)
			return
		}
		defer file.Close()
		ent := defaultEntity
		if v := r.FormValue("entity"); v != "" {
			ent = v
		}
		if ent == "" {
			ent = "misc"
		}
		url, err := s.SaveUpload(ent, file, header)
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"data":null,"error":%q}`, err.Error()), http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"data":{"url":%q},"error":null}`, url)
	}
}

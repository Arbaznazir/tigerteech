package auth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Role string

const (
	RoleAdmin    Role = "admin"
	RoleCustomer Role = "customer"
)

type User struct {
	ID               uuid.UUID `json:"id"`
	Email            string    `json:"email"`
	Name             string    `json:"name"`
	Phone            string    `json:"phone"`
	AvatarURL        string    `json:"avatarUrl"`
	Gender           string    `json:"gender"`
	AddressJSON      []byte    `json:"addressJson,omitempty"`
	MeasurementsJSON []byte    `json:"measurementsJson,omitempty"`
	Role             Role      `json:"role"`
	PasswordHash     string    `json:"-"`
	CreatedAt        time.Time `json:"createdAt,omitempty"`
}

type Claims struct {
	UserID uuid.UUID `json:"uid"`
	Email  string    `json:"email"`
	Role   Role      `json:"role"`
	jwt.RegisteredClaims
}

type Service struct {
	DB     *sql.DB
	Secret []byte
	TTL    time.Duration
}

func (s *Service) HashPassword(pw string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	return string(b), err
}

func (s *Service) CheckPassword(hash, pw string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(pw)) == nil
}

func (s *Service) EnsureAdmin(ctx context.Context, email, password, name string) error {
	var id uuid.UUID
	err := s.DB.QueryRowContext(ctx, `SELECT id FROM users WHERE email=$1`, strings.ToLower(email)).Scan(&id)
	if err == nil {
		return nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return err
	}
	hash, err := s.HashPassword(password)
	if err != nil {
		return err
	}
	uid := uuid.New()
	_, err = s.DB.ExecContext(ctx, `
		INSERT INTO users (id, email, password_hash, name, role)
		VALUES ($1,$2,$3,$4,'admin')`, uid, strings.ToLower(email), hash, name)
	return err
}

func (s *Service) Authenticate(ctx context.Context, email, password string) (*User, string, error) {
	u, err := s.FindByEmail(ctx, email)
	if err != nil {
		return nil, "", errors.New("invalid credentials")
	}
	if !s.CheckPassword(u.PasswordHash, password) {
		return nil, "", errors.New("invalid credentials")
	}
	token, err := s.IssueToken(u)
	if err != nil {
		return nil, "", err
	}
	return u, token, nil
}

func (s *Service) FindByEmail(ctx context.Context, email string) (*User, error) {
	var u User
	var role string
	err := s.DB.QueryRowContext(ctx, `
		SELECT id, email, password_hash, name, phone,
			COALESCE(avatar_url,''), COALESCE(gender,''), COALESCE(address_json,'{}'::jsonb),
			COALESCE(measurements_json,'[]'::jsonb), role, created_at
		FROM users WHERE email=$1`,
		strings.ToLower(email),
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Phone, &u.AvatarURL, &u.Gender, &u.AddressJSON, &u.MeasurementsJSON, &role, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	u.Role = Role(role)
	return &u, nil
}

func (s *Service) FindByID(ctx context.Context, id uuid.UUID) (*User, error) {
	var u User
	var role string
	err := s.DB.QueryRowContext(ctx, `
		SELECT id, email, password_hash, name, phone,
			COALESCE(avatar_url,''), COALESCE(gender,''), COALESCE(address_json,'{}'::jsonb),
			COALESCE(measurements_json,'[]'::jsonb), role, created_at
		FROM users WHERE id=$1`, id,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.Name, &u.Phone, &u.AvatarURL, &u.Gender, &u.AddressJSON, &u.MeasurementsJSON, &role, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	u.Role = Role(role)
	return &u, nil
}

func (s *Service) OptionalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		if strings.HasPrefix(h, "Bearer ") {
			claims, err := s.ParseToken(strings.TrimPrefix(h, "Bearer "))
			if err == nil {
				r = r.WithContext(WithUser(r.Context(), claims))
			}
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Service) RequireUser(next http.Handler) http.Handler {
	return s.Middleware(next)
}

func (s *Service) IssueToken(u *User) (string, error) {
	ttl := s.TTL
	if ttl == 0 {
		ttl = 24 * time.Hour
	}
	claims := Claims{
		UserID: u.ID,
		Email:  u.Email,
		Role:   u.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   u.ID.String(),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(s.Secret)
}

func (s *Service) ParseToken(tokenStr string) (*Claims, error) {
	tok, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (any, error) {
		if t.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return s.Secret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := tok.Claims.(*Claims)
	if !ok || !tok.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

type ctxKey int

const userKey ctxKey = 1

func WithUser(ctx context.Context, c *Claims) context.Context {
	return context.WithValue(ctx, userKey, c)
}

func UserFrom(ctx context.Context) *Claims {
	c, _ := ctx.Value(userKey).(*Claims)
	return c
}

func (s *Service) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		if !strings.HasPrefix(h, "Bearer ") {
			http.Error(w, `{"data":null,"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		claims, err := s.ParseToken(strings.TrimPrefix(h, "Bearer "))
		if err != nil {
			http.Error(w, `{"data":null,"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r.WithContext(WithUser(r.Context(), claims)))
	})
}

func (s *Service) RequireAdmin(next http.Handler) http.Handler {
	return s.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		u := UserFrom(r.Context())
		if u == nil || u.Role != RoleAdmin {
			http.Error(w, `{"data":null,"error":"forbidden"}`, http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	}))
}

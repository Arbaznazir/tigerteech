package catalog

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Category struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Slug         string    `json:"slug"`
	ImageURL     string    `json:"imageUrl"`
	SortOrder    int       `json:"sortOrder"`
	IsActive     bool      `json:"isActive"`
	CreatedAt    time.Time `json:"createdAt"`
	ProductCount int       `json:"productCount"`
}

type Tag struct {
	ID     uuid.UUID `json:"id"`
	Slug   string    `json:"slug"`
	Label  string    `json:"label"`
	Kind   string    `json:"kind"`
	Accent string    `json:"accent"`
}

type DetailField struct {
	ID        uuid.UUID `json:"id"`
	Key       string    `json:"key"`
	Label     string    `json:"label"`
	SortOrder int       `json:"sortOrder"`
	IsSystem  bool      `json:"isSystem"`
}

type Variant struct {
	ID             uuid.UUID `json:"id"`
	ProductID      uuid.UUID `json:"productId"`
	SKU            string    `json:"sku"`
	MaterialName   string    `json:"materialName"`
	ColorName      string    `json:"colorName"`
	ColorHex       string    `json:"colorHex"`
	SizeLabel      string    `json:"sizeLabel"`
	Price          float64   `json:"price"`
	CompareAtPrice *float64  `json:"compareAtPrice,omitempty"`
	Stock          *int      `json:"stock,omitempty"`
	MaxPerOrder    int       `json:"maxPerOrder"`
	IsActive       bool      `json:"isActive"`
}

type ProductImage struct {
	ID        uuid.UUID `json:"id"`
	ProductID uuid.UUID `json:"productId"`
	URL       string    `json:"url"`
	SortOrder int       `json:"sortOrder"`
	Alt       string    `json:"alt"`
}

type Product struct {
	ID                   uuid.UUID         `json:"id"`
	Name                 string            `json:"name"`
	Slug                 string            `json:"slug"`
	Description          string            `json:"description"`
	Details              json.RawMessage   `json:"details"`
	Status               string            `json:"status"`
	GenderFit            string            `json:"genderFit"`
	RequiresShirtMeas    bool              `json:"requiresShirtMeas"`
	RequiresTrouserMeas  bool              `json:"requiresTrouserMeas"`
	RatingAvg            float64           `json:"ratingAvg"`
	RatingCount          int               `json:"ratingCount"`
	PublishedAt          *time.Time        `json:"publishedAt,omitempty"`
	CreatedAt            time.Time         `json:"createdAt"`
	UpdatedAt            time.Time         `json:"updatedAt"`
	Images               []ProductImage    `json:"images"`
	Variants             []Variant         `json:"variants"`
	Tags                 []Tag             `json:"tags"`
	CategoryIDs          []uuid.UUID       `json:"categoryIds"`
	PriceMin             float64           `json:"priceMin"`
	PriceMax             float64           `json:"priceMax"`
	PrimaryImage         string            `json:"primaryImage"`
}

type ProductInput struct {
	Name                string          `json:"name"`
	Slug                string          `json:"slug"`
	Description         string          `json:"description"`
	Details             json.RawMessage `json:"details"`
	Status              string          `json:"status"`
	GenderFit           string          `json:"genderFit"`
	RequiresShirtMeas   *bool           `json:"requiresShirtMeas"`
	RequiresTrouserMeas *bool           `json:"requiresTrouserMeas"`
	// CategoryIDs are accepted as strings so a single bad value never fails the
	// whole decode with a opaque "invalid body" — SaveProduct skips non-UUIDs.
	CategoryIDs []string `json:"categoryIds"`
	TagSlugs    []string `json:"tagSlugs"`
	Images      []struct {
		URL       string `json:"url"`
		SortOrder int    `json:"sortOrder"`
		Alt       string `json:"alt"`
	} `json:"images"`
	Variants []struct {
		SKU            string   `json:"sku"`
		MaterialName   string   `json:"materialName"`
		ColorName      string   `json:"colorName"`
		ColorHex       string   `json:"colorHex"`
		SizeLabel      string   `json:"sizeLabel"`
		Price          float64  `json:"price"`
		CompareAtPrice *float64 `json:"compareAtPrice"`
		Stock          *int     `json:"stock"`
		MaxPerOrder    *int     `json:"maxPerOrder"`
		IsActive       *bool    `json:"isActive"`
	} `json:"variants"`
}

type InventoryAdjust struct {
	Set        *int  `json:"set"`
	Add        *int  `json:"add"`
	OutOfStock *bool `json:"outOfStock"`
}

package catalog

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Store struct {
	DB *sql.DB
}

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	prevDash := false
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			prevDash = false
			continue
		}
		if !prevDash {
			b.WriteByte('-')
			prevDash = true
		}
	}
	return strings.Trim(b.String(), "-")
}

func (s *Store) EnsureDefaultTags(ctx context.Context) error {
	defaults := []Tag{
		{Slug: "bestseller", Label: "Bestseller", Kind: "collection"},
		{Slug: "new_arrival", Label: "New Arrival", Kind: "collection"},
		{Slug: "popular", Label: "Popular", Kind: "badge"},
		{Slug: "sale", Label: "Sale", Kind: "deal_flag"},
		{Slug: "cruelty-free", Label: "Cruelty-free", Kind: "highlight", Accent: "green"},
		{Slug: "natural-fabrics", Label: "100% natural fabrics", Kind: "highlight", Accent: "gold"},
		{Slug: "made-to-be-noticed", Label: "Made to be noticed", Kind: "highlight", Accent: "rose"},
	}
	for _, t := range defaults {
		var id uuid.UUID
		err := s.DB.QueryRowContext(ctx, `SELECT id FROM product_tags WHERE slug=$1`, t.Slug).Scan(&id)
		if err == nil {
			continue
		}
		if !errors.Is(err, sql.ErrNoRows) {
			return err
		}
		_, err = s.DB.ExecContext(ctx, `
			INSERT INTO product_tags (id, slug, label, kind, accent) VALUES ($1,$2,$3,$4,$5)`,
			uuid.New(), t.Slug, t.Label, t.Kind, t.Accent)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) EnsureDefaultDetailFields(ctx context.Context) error {
	// Category is owned by Shop placement (product_categories) — not a detail field.
	defaults := []DetailField{
		{Key: "style", Label: "Style", SortOrder: 20, IsSystem: true},
		{Key: "pattern", Label: "Pattern", SortOrder: 30, IsSystem: true},
		{Key: "type", Label: "Type", SortOrder: 40, IsSystem: true},
		{Key: "neck", Label: "Neck Type", SortOrder: 50, IsSystem: true},
		{Key: "fit", Label: "Fit", SortOrder: 60, IsSystem: true},
		{Key: "bottom", Label: "Bottom Style", SortOrder: 70, IsSystem: true},
	}
	// Hide legacy "category" detail field if it was seeded earlier.
	_, _ = s.DB.ExecContext(ctx, `DELETE FROM product_detail_fields WHERE field_key='category' AND is_system=TRUE`)
	for _, f := range defaults {
		var id uuid.UUID
		err := s.DB.QueryRowContext(ctx, `SELECT id FROM product_detail_fields WHERE field_key=$1`, f.Key).Scan(&id)
		if err == nil {
			continue
		}
		if !errors.Is(err, sql.ErrNoRows) {
			return err
		}
		_, err = s.DB.ExecContext(ctx, `
			INSERT INTO product_detail_fields (id, field_key, label, sort_order, is_system)
			VALUES ($1,$2,$3,$4,$5)`,
			uuid.New(), f.Key, f.Label, f.SortOrder, f.IsSystem)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) ListCategories(ctx context.Context, activeOnly bool) ([]Category, error) {
	q := `
		SELECT c.id, c.name, c.slug, c.image_url, c.sort_order, c.is_active, c.created_at,
			COALESCE((SELECT COUNT(*)::int FROM product_categories pc WHERE pc.category_id=c.id), 0)
		FROM categories c`
	if activeOnly {
		q += ` WHERE c.is_active=TRUE`
	}
	q += ` ORDER BY c.sort_order ASC, c.name ASC`
	rows, err := s.DB.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]Category, 0)
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.ImageURL, &c.SortOrder, &c.IsActive, &c.CreatedAt, &c.ProductCount); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) GetCategory(ctx context.Context, id uuid.UUID) (*Category, error) {
	var c Category
	err := s.DB.QueryRowContext(ctx, `
		SELECT c.id, c.name, c.slug, c.image_url, c.sort_order, c.is_active, c.created_at,
			COALESCE((SELECT COUNT(*)::int FROM product_categories pc WHERE pc.category_id=c.id), 0)
		FROM categories c WHERE c.id=$1`, id,
	).Scan(&c.ID, &c.Name, &c.Slug, &c.ImageURL, &c.SortOrder, &c.IsActive, &c.CreatedAt, &c.ProductCount)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (s *Store) CountProductsInCategory(ctx context.Context, categoryID uuid.UUID) (int, error) {
	var n int
	err := s.DB.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM product_categories WHERE category_id=$1`, categoryID,
	).Scan(&n)
	return n, err
}

func (s *Store) ListProductsByCategoryID(ctx context.Context, categoryID uuid.UUID) ([]Product, error) {
	rows, err := s.DB.QueryContext(ctx, `
		SELECT p.id, p.name, p.slug, p.description, p.details_json, p.status, p.gender_fit,
			p.requires_shirt_meas, p.requires_trouser_meas, p.rating_avg, p.rating_count,
			p.published_at, p.created_at, p.updated_at
		FROM products p
		JOIN product_categories pc ON pc.product_id=p.id
		WHERE pc.category_id=$1
		ORDER BY p.name ASC`, categoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	products := make([]Product, 0)
	for rows.Next() {
		var p Product
		var details []byte
		if err := rows.Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &details, &p.Status, &p.GenderFit,
			&p.RequiresShirtMeas, &p.RequiresTrouserMeas, &p.RatingAvg, &p.RatingCount,
			&p.PublishedAt, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		if len(details) == 0 {
			p.Details = json.RawMessage(`{}`)
		} else {
			p.Details = details
		}
		products = append(products, p)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	ptrs := make([]*Product, len(products))
	for i := range products {
		ptrs[i] = &products[i]
	}
	if err := s.hydrateProducts(ctx, ptrs); err != nil {
		return nil, err
	}
	return products, nil
}

func (s *Store) RemoveProductFromCategory(ctx context.Context, categoryID, productID uuid.UUID) error {
	_, err := s.DB.ExecContext(ctx,
		`DELETE FROM product_categories WHERE category_id=$1 AND product_id=$2`,
		categoryID, productID)
	return err
}

func (s *Store) MoveProductCategory(ctx context.Context, productID, fromCategoryID, toCategoryID uuid.UUID) error {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()
	if _, err := tx.ExecContext(ctx,
		`DELETE FROM product_categories WHERE category_id=$1 AND product_id=$2`,
		fromCategoryID, productID); err != nil {
		return err
	}
	if toCategoryID != uuid.Nil {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO product_categories (product_id, category_id) VALUES ($1,$2)
			ON CONFLICT DO NOTHING`, productID, toCategoryID); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (s *Store) UpsertCategory(ctx context.Context, c *Category) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	if c.Slug == "" {
		c.Slug = slugify(c.Name)
	}
	_, err := s.DB.ExecContext(ctx, `
		INSERT INTO categories (id, name, slug, image_url, sort_order, is_active)
		VALUES ($1,$2,$3,$4,$5,$6)
		ON CONFLICT (id) DO UPDATE SET
			name=EXCLUDED.name, slug=EXCLUDED.slug, image_url=EXCLUDED.image_url,
			sort_order=EXCLUDED.sort_order, is_active=EXCLUDED.is_active`,
		c.ID, c.Name, c.Slug, c.ImageURL, c.SortOrder, c.IsActive)
	return err
}

func (s *Store) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	n, err := s.CountProductsInCategory(ctx, id)
	if err != nil {
		return err
	}
	if n > 0 {
		return fmt.Errorf("cannot delete: %d product(s) still in this category — remove or reassign them first", n)
	}
	_, err = s.DB.ExecContext(ctx, `DELETE FROM categories WHERE id=$1`, id)
	return err
}

func (s *Store) ListTags(ctx context.Context) ([]Tag, error) {
	rows, err := s.DB.QueryContext(ctx, `
		SELECT id, slug, label, kind, COALESCE(accent,'') FROM product_tags
		ORDER BY kind ASC, label ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]Tag, 0)
	for rows.Next() {
		var t Tag
		if err := rows.Scan(&t.ID, &t.Slug, &t.Label, &t.Kind, &t.Accent); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *Store) UpsertTag(ctx context.Context, t *Tag) error {
	if t.Label == "" {
		return errors.New("label required")
	}
	if t.Slug == "" {
		t.Slug = slugify(t.Label)
	}
	if t.Kind == "" {
		t.Kind = "highlight"
	}
	switch t.Kind {
	case "badge", "collection", "deal_flag", "highlight":
	default:
		return errors.New("invalid tag kind")
	}
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
		_, err := s.DB.ExecContext(ctx, `
			INSERT INTO product_tags (id, slug, label, kind, accent) VALUES ($1,$2,$3,$4,$5)`,
			t.ID, t.Slug, t.Label, t.Kind, t.Accent)
		return err
	}
	_, err := s.DB.ExecContext(ctx, `
		UPDATE product_tags SET slug=$2, label=$3, kind=$4, accent=$5 WHERE id=$1`,
		t.ID, t.Slug, t.Label, t.Kind, t.Accent)
	return err
}

func (s *Store) DeleteTag(ctx context.Context, id uuid.UUID) error {
	_, err := s.DB.ExecContext(ctx, `DELETE FROM product_tags WHERE id=$1`, id)
	return err
}

func (s *Store) ListDetailFields(ctx context.Context) ([]DetailField, error) {
	rows, err := s.DB.QueryContext(ctx, `
		SELECT id, field_key, label, sort_order, is_system
		FROM product_detail_fields ORDER BY sort_order ASC, label ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]DetailField, 0)
	for rows.Next() {
		var f DetailField
		if err := rows.Scan(&f.ID, &f.Key, &f.Label, &f.SortOrder, &f.IsSystem); err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

func (s *Store) UpsertDetailField(ctx context.Context, f *DetailField) error {
	if f.Label == "" {
		return errors.New("label required")
	}
	if f.Key == "" {
		f.Key = slugify(f.Label)
	}
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
		_, err := s.DB.ExecContext(ctx, `
			INSERT INTO product_detail_fields (id, field_key, label, sort_order, is_system)
			VALUES ($1,$2,$3,$4,$5)`,
			f.ID, f.Key, f.Label, f.SortOrder, f.IsSystem)
		return err
	}
	_, err := s.DB.ExecContext(ctx, `
		UPDATE product_detail_fields SET field_key=$2, label=$3, sort_order=$4 WHERE id=$1`,
		f.ID, f.Key, f.Label, f.SortOrder)
	return err
}

func (s *Store) DeleteDetailField(ctx context.Context, id uuid.UUID) error {
	_, err := s.DB.ExecContext(ctx, `DELETE FROM product_detail_fields WHERE id=$1`, id)
	return err
}

type ProductFilter struct {
	Tag      string
	Category string
	Query    string
	Status   string // empty = active for public; admin can pass all
	Limit    int
	Offset   int
}

type ProductPage struct {
	Items []Product `json:"items"`
	Total int       `json:"total"`
}

func (s *Store) ListProducts(ctx context.Context, f ProductFilter) ([]Product, error) {
	page, err := s.ListProductsPage(ctx, f)
	if err != nil {
		return nil, err
	}
	return page.Items, nil
}

func (s *Store) ListProductsPage(ctx context.Context, f ProductFilter) (*ProductPage, error) {
	if f.Limit <= 0 || f.Limit > 48 {
		f.Limit = 12
	}
	if f.Offset < 0 {
		f.Offset = 0
	}

	args := []any{}
	where := []string{"1=1"}
	orderBy := "p.created_at DESC, p.id DESC"
	q := strings.TrimSpace(f.Query)

	if f.Status == "" {
		where = append(where, "p.status='active'")
		// Gift-only / hidden products stay out of the public catalog.
		where = append(where, "COALESCE(p.listing_visibility,'catalog')='catalog'")
	} else if f.Status != "all" {
		args = append(args, f.Status)
		where = append(where, fmt.Sprintf("p.status=$%d", len(args)))
	}
	if f.Tag != "" {
		args = append(args, f.Tag)
		where = append(where, fmt.Sprintf(`EXISTS (
			SELECT 1 FROM product_tag_map m
			JOIN product_tags t ON t.id=m.tag_id
			WHERE m.product_id=p.id AND t.slug=$%d)`, len(args)))
	}
	if f.Category != "" {
		args = append(args, f.Category)
		where = append(where, fmt.Sprintf(`EXISTS (
			SELECT 1 FROM product_categories pc
			JOIN categories c ON c.id=pc.category_id
			WHERE pc.product_id=p.id AND c.slug=$%d)`, len(args)))
	}
	if q != "" {
		args = append(args, q)
		qi := len(args)
		args = append(args, "%"+strings.ToLower(q)+"%")
		likeI := len(args)
		// FTS (websearch) + trigram fuzzy + prefix/ILIKE fallback
		where = append(where, fmt.Sprintf(`(
			COALESCE(p.search_tsv, to_tsvector('english','')) @@ websearch_to_tsquery('english', $%d)
			OR p.name %% $%d
			OR LOWER(p.name) LIKE $%d
			OR LOWER(p.description) LIKE $%d
		)`, qi, qi, likeI, likeI))
		orderBy = fmt.Sprintf(`
			CASE WHEN LOWER(p.name) LIKE LOWER($%d) || '%%' THEN 0 ELSE 1 END,
			GREATEST(
				COALESCE(ts_rank_cd(p.search_tsv, websearch_to_tsquery('english', $%d)), 0),
				COALESCE(similarity(p.name, $%d), 0)
			) DESC,
			p.created_at DESC, p.id DESC`, qi, qi, qi)
	}

	countArgs := append([]any{}, args...)
	var total int
	countQ := fmt.Sprintf(`SELECT COUNT(*) FROM products p WHERE %s`, strings.Join(where, " AND "))
	if err := s.DB.QueryRowContext(ctx, countQ, countArgs...).Scan(&total); err != nil {
		return nil, err
	}

	args = append(args, f.Limit, f.Offset)
	listQ := fmt.Sprintf(`
		SELECT p.id, p.name, p.slug, p.description, p.details_json, p.status, p.gender_fit,
			p.requires_shirt_meas, p.requires_trouser_meas, p.rating_avg, p.rating_count,
			p.published_at, p.created_at, p.updated_at
		FROM products p
		WHERE %s
		ORDER BY %s
		LIMIT $%d OFFSET $%d`, strings.Join(where, " AND "), orderBy, len(args)-1, len(args))

	rows, err := s.DB.QueryContext(ctx, listQ, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := make([]Product, 0, f.Limit)
	for rows.Next() {
		var p Product
		var details []byte
		if err := rows.Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &details, &p.Status, &p.GenderFit,
			&p.RequiresShirtMeas, &p.RequiresTrouserMeas, &p.RatingAvg, &p.RatingCount,
			&p.PublishedAt, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		if len(details) == 0 {
			p.Details = json.RawMessage(`{}`)
		} else {
			p.Details = details
		}
		products = append(products, p)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	ptrs := make([]*Product, len(products))
	for i := range products {
		ptrs[i] = &products[i]
	}
	if err := s.hydrateProducts(ctx, ptrs); err != nil {
		return nil, err
	}
	return &ProductPage{Items: products, Total: total}, nil
}

func (s *Store) GetBySlug(ctx context.Context, slug string) (*Product, error) {
	var p Product
	var details []byte
	err := s.DB.QueryRowContext(ctx, `
		SELECT id, name, slug, description, details_json, status, gender_fit,
			requires_shirt_meas, requires_trouser_meas, rating_avg, rating_count,
			published_at, created_at, updated_at
		FROM products WHERE slug=$1`, slug,
	).Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &details, &p.Status, &p.GenderFit,
		&p.RequiresShirtMeas, &p.RequiresTrouserMeas, &p.RatingAvg, &p.RatingCount,
		&p.PublishedAt, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if len(details) == 0 {
		p.Details = json.RawMessage(`{}`)
	} else {
		p.Details = details
	}
	if err := s.hydrateProduct(ctx, &p); err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *Store) GetByID(ctx context.Context, id uuid.UUID) (*Product, error) {
	var p Product
	var details []byte
	err := s.DB.QueryRowContext(ctx, `
		SELECT id, name, slug, description, details_json, status, gender_fit,
			requires_shirt_meas, requires_trouser_meas, rating_avg, rating_count,
			published_at, created_at, updated_at
		FROM products WHERE id=$1`, id,
	).Scan(&p.ID, &p.Name, &p.Slug, &p.Description, &details, &p.Status, &p.GenderFit,
		&p.RequiresShirtMeas, &p.RequiresTrouserMeas, &p.RatingAvg, &p.RatingCount,
		&p.PublishedAt, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if len(details) == 0 {
		p.Details = json.RawMessage(`{}`)
	} else {
		p.Details = details
	}
	if err := s.hydrateProduct(ctx, &p); err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *Store) hydrateProduct(ctx context.Context, p *Product) error {
	return s.hydrateProducts(ctx, []*Product{p})
}

func (s *Store) hydrateProducts(ctx context.Context, products []*Product) error {
	if len(products) == 0 {
		return nil
	}
	byID := make(map[uuid.UUID]*Product, len(products))
	ids := make([]uuid.UUID, 0, len(products))
	for _, p := range products {
		if p == nil {
			continue
		}
		p.Images = nil
		p.Variants = nil
		p.Tags = nil
		p.CategoryIDs = nil
		p.PriceMin, p.PriceMax = 0, 0
		p.PrimaryImage = ""
		byID[p.ID] = p
		ids = append(ids, p.ID)
	}
	if len(ids) == 0 {
		return nil
	}

	args := make([]any, len(ids))
	ph := make([]string, len(ids))
	for i, id := range ids {
		args[i] = id
		ph[i] = fmt.Sprintf("$%d", i+1)
	}
	inList := strings.Join(ph, ",")

	imgRows, err := s.DB.QueryContext(ctx, fmt.Sprintf(`
		SELECT id, product_id, url, sort_order, alt
		FROM product_images
		WHERE product_id IN (%s)
		ORDER BY product_id, sort_order ASC`, inList), args...)
	if err != nil {
		return err
	}
	defer imgRows.Close()
	for imgRows.Next() {
		var im ProductImage
		if err := imgRows.Scan(&im.ID, &im.ProductID, &im.URL, &im.SortOrder, &im.Alt); err != nil {
			return err
		}
		p := byID[im.ProductID]
		if p == nil {
			continue
		}
		p.Images = append(p.Images, im)
		if p.PrimaryImage == "" {
			p.PrimaryImage = im.URL
		}
	}
	if err := imgRows.Err(); err != nil {
		return err
	}

	vRows, err := s.DB.QueryContext(ctx, fmt.Sprintf(`
		SELECT id, product_id, sku, material_name, color_name, color_hex, size_label,
			price, compare_at_price, stock, max_per_order, is_active
		FROM product_variants
		WHERE product_id IN (%s)
		ORDER BY product_id, material_name, color_name`, inList), args...)
	if err != nil {
		return err
	}
	defer vRows.Close()
	for vRows.Next() {
		var v Variant
		if err := vRows.Scan(&v.ID, &v.ProductID, &v.SKU, &v.MaterialName, &v.ColorName, &v.ColorHex, &v.SizeLabel,
			&v.Price, &v.CompareAtPrice, &v.Stock, &v.MaxPerOrder, &v.IsActive); err != nil {
			return err
		}
		if v.MaxPerOrder < 0 {
			v.MaxPerOrder = 0
		}
		p := byID[v.ProductID]
		if p == nil {
			continue
		}
		p.Variants = append(p.Variants, v)
		if len(p.Variants) == 1 {
			p.PriceMin, p.PriceMax = v.Price, v.Price
		} else {
			if v.Price < p.PriceMin {
				p.PriceMin = v.Price
			}
			if v.Price > p.PriceMax {
				p.PriceMax = v.Price
			}
		}
	}
	if err := vRows.Err(); err != nil {
		return err
	}

	tRows, err := s.DB.QueryContext(ctx, fmt.Sprintf(`
		SELECT m.product_id, t.id, t.slug, t.label, t.kind, COALESCE(t.accent,'')
		FROM product_tag_map m
		JOIN product_tags t ON t.id=m.tag_id
		WHERE m.product_id IN (%s)`, inList), args...)
	if err != nil {
		return err
	}
	defer tRows.Close()
	for tRows.Next() {
		var pid uuid.UUID
		var t Tag
		if err := tRows.Scan(&pid, &t.ID, &t.Slug, &t.Label, &t.Kind, &t.Accent); err != nil {
			return err
		}
		if p := byID[pid]; p != nil {
			p.Tags = append(p.Tags, t)
		}
	}
	if err := tRows.Err(); err != nil {
		return err
	}

	cRows, err := s.DB.QueryContext(ctx, fmt.Sprintf(`
		SELECT product_id, category_id FROM product_categories
		WHERE product_id IN (%s)`, inList), args...)
	if err != nil {
		return err
	}
	defer cRows.Close()
	for cRows.Next() {
		var pid, cid uuid.UUID
		if err := cRows.Scan(&pid, &cid); err != nil {
			return err
		}
		if p := byID[pid]; p != nil {
			p.CategoryIDs = append(p.CategoryIDs, cid)
		}
	}
	return cRows.Err()
}

func (s *Store) SaveProduct(ctx context.Context, id uuid.UUID, in ProductInput) (*Product, error) {
	if in.Name == "" {
		return nil, errors.New("name required")
	}
	if in.Slug == "" {
		in.Slug = slugify(in.Name)
	}
	if in.Status == "" {
		in.Status = "draft"
	}
	if in.GenderFit == "" {
		in.GenderFit = "unisex"
	}
	if in.Details == nil {
		in.Details = json.RawMessage(`{}`)
	}
	shirt := true
	trouser := true
	if in.RequiresShirtMeas != nil {
		shirt = *in.RequiresShirtMeas
	}
	if in.RequiresTrouserMeas != nil {
		trouser = *in.RequiresTrouserMeas
	}

	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()

	now := time.Now()
	var published any
	if in.Status == "active" {
		published = now
	}

	if id == uuid.Nil {
		id = uuid.New()
		_, err = tx.ExecContext(ctx, `
			INSERT INTO products (
				id, name, slug, description, details_json, status, gender_fit,
				requires_shirt_meas, requires_trouser_meas, published_at, created_at, updated_at
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
			id, in.Name, in.Slug, in.Description, []byte(in.Details), in.Status, in.GenderFit,
			shirt, trouser, published, now)
	} else {
		_, err = tx.ExecContext(ctx, `
			UPDATE products SET name=$2, slug=$3, description=$4, details_json=$5, status=$6,
				gender_fit=$7, requires_shirt_meas=$8, requires_trouser_meas=$9,
				published_at=COALESCE(published_at, $10), updated_at=$11
			WHERE id=$1`,
			id, in.Name, in.Slug, in.Description, []byte(in.Details), in.Status, in.GenderFit,
			shirt, trouser, published, now)
	}
	if err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM product_images WHERE product_id=$1`, id); err != nil {
		return nil, err
	}
	for i, im := range in.Images {
		if im.URL == "" {
			continue
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO product_images (id, product_id, url, sort_order, alt) VALUES ($1,$2,$3,$4,$5)`,
			uuid.New(), id, im.URL, im.SortOrder, im.Alt)
		if err != nil {
			return nil, err
		}
		_ = i
	}

	existingRows, err := tx.QueryContext(ctx, `
		SELECT id, material_name, color_name, size_label, stock
		FROM product_variants WHERE product_id=$1`, id)
	if err != nil {
		return nil, err
	}
	type existingVar struct {
		ID    uuid.UUID
		Stock *int
	}
	existing := map[string]existingVar{}
	for existingRows.Next() {
		var ev existingVar
		var mat, color, size string
		if err := existingRows.Scan(&ev.ID, &mat, &color, &size, &ev.Stock); err != nil {
			existingRows.Close()
			return nil, err
		}
		existing[variantKey(mat, color, size)] = ev
	}
	existingRows.Close()

	keep := map[uuid.UUID]bool{}
	for _, v := range in.Variants {
		active := true
		if v.IsActive != nil {
			active = *v.IsActive
		}
		hex := v.ColorHex
		if hex == "" {
			hex = "#000000"
		}
		maxPer := 0
		if v.MaxPerOrder != nil && *v.MaxPerOrder > 0 {
			maxPer = *v.MaxPerOrder
		}
		key := variantKey(v.MaterialName, v.ColorName, v.SizeLabel)
		if old, ok := existing[key]; ok {
			keep[old.ID] = true
			_, err = tx.ExecContext(ctx, `
				UPDATE product_variants SET
					sku=$2, material_name=$3, color_name=$4, color_hex=$5, size_label=$6,
					price=$7, compare_at_price=$8, max_per_order=$9, is_active=$10
				WHERE id=$1`,
				old.ID, v.SKU, v.MaterialName, v.ColorName, hex, v.SizeLabel,
				v.Price, v.CompareAtPrice, maxPer, active)
			if err != nil {
				return nil, err
			}
			continue
		}
		vid := uuid.New()
		keep[vid] = true
		stockVal := 0
		if v.Stock != nil && *v.Stock > 0 {
			stockVal = *v.Stock
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO product_variants (
				id, product_id, sku, material_name, color_name, color_hex, size_label,
				price, compare_at_price, stock, max_per_order, is_active
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
			vid, id, v.SKU, v.MaterialName, v.ColorName, hex, v.SizeLabel,
			v.Price, v.CompareAtPrice, stockVal, maxPer, active)
		if err != nil {
			return nil, err
		}
	}
	for key, old := range existing {
		_ = key
		if keep[old.ID] {
			continue
		}
		// Soft-remove so order history can keep variant references.
		if _, err := tx.ExecContext(ctx, `
			UPDATE product_variants SET is_active=FALSE, stock=0 WHERE id=$1`, old.ID); err != nil {
			return nil, err
		}
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM product_categories WHERE product_id=$1`, id); err != nil {
		return nil, err
	}
	for _, raw := range in.CategoryIDs {
		cid, err := uuid.Parse(strings.TrimSpace(raw))
		if err != nil {
			continue
		}
		_, err = tx.ExecContext(ctx, `INSERT INTO product_categories (product_id, category_id) VALUES ($1,$2)`, id, cid)
		if err != nil {
			// Skip missing/orphan category ids instead of failing the whole save.
			continue
		}
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM product_tag_map WHERE product_id=$1`, id); err != nil {
		return nil, err
	}
	for _, slug := range in.TagSlugs {
		var tid uuid.UUID
		err := tx.QueryRowContext(ctx, `SELECT id FROM product_tags WHERE slug=$1`, slug).Scan(&tid)
		if err != nil {
			continue
		}
		_, err = tx.ExecContext(ctx, `INSERT INTO product_tag_map (product_id, tag_id) VALUES ($1,$2)`, id, tid)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return s.GetByID(ctx, id)
}

func (s *Store) DeleteProduct(ctx context.Context, id uuid.UUID) error {
	_, err := s.DB.ExecContext(ctx, `DELETE FROM products WHERE id=$1`, id)
	return err
}

func variantKey(material, color, size string) string {
	return strings.ToLower(strings.TrimSpace(material)) + "|" +
		strings.ToLower(strings.TrimSpace(color)) + "|" +
		strings.ToLower(strings.TrimSpace(size))
}

func (s *Store) GetVariant(ctx context.Context, id uuid.UUID) (*Variant, error) {
	var v Variant
	err := s.DB.QueryRowContext(ctx, `
		SELECT id, product_id, sku, material_name, color_name, color_hex, size_label,
			price, compare_at_price, stock, max_per_order, is_active
		FROM product_variants WHERE id=$1`, id).Scan(
		&v.ID, &v.ProductID, &v.SKU, &v.MaterialName, &v.ColorName, &v.ColorHex, &v.SizeLabel,
		&v.Price, &v.CompareAtPrice, &v.Stock, &v.MaxPerOrder, &v.IsActive)
	if err != nil {
		return nil, err
	}
	if v.MaxPerOrder < 0 {
		v.MaxPerOrder = 0
	}
	return &v, nil
}

func (s *Store) AdjustInventory(ctx context.Context, variantID uuid.UUID, in InventoryAdjust) (*Variant, error) {
	v, err := s.GetVariant(ctx, variantID)
	if err != nil {
		return nil, err
	}
	cur := 0
	if v.Stock != nil {
		cur = *v.Stock
	}
	next := cur
	if in.OutOfStock != nil && *in.OutOfStock {
		next = 0
	} else if in.Set != nil {
		if *in.Set < 0 {
			return nil, errors.New("stock cannot be negative")
		}
		next = *in.Set
	} else if in.Add != nil {
		next = cur + *in.Add
		if next < 0 {
			next = 0
		}
	} else {
		return nil, errors.New("provide set, add, or outOfStock")
	}
	_, err = s.DB.ExecContext(ctx, `UPDATE product_variants SET stock=$2 WHERE id=$1`, variantID, next)
	if err != nil {
		return nil, err
	}
	return s.GetVariant(ctx, variantID)
}

func (s *Store) ListInventory(ctx context.Context) ([]map[string]any, error) {
	rows, err := s.DB.QueryContext(ctx, `
		SELECT p.id, p.name, p.slug, v.id, v.material_name, v.color_name, v.color_hex,
			v.stock, v.max_per_order, v.is_active, v.price
		FROM product_variants v
		JOIN products p ON p.id = v.product_id
		WHERE v.is_active = TRUE
		ORDER BY p.name, v.material_name, v.color_name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var pid, vid uuid.UUID
		var name, slug, mat, color, hex string
		var stock sql.NullInt64
		var maxPer int
		var active bool
		var price float64
		if err := rows.Scan(&pid, &name, &slug, &vid, &mat, &color, &hex, &stock, &maxPer, &active, &price); err != nil {
			return nil, err
		}
		var stockVal any
		if stock.Valid {
			stockVal = int(stock.Int64)
		} else {
			stockVal = nil
		}
		out = append(out, map[string]any{
			"productId":   pid,
			"productName": name,
			"productSlug": slug,
			"variantId":   vid,
			"materialName": mat,
			"colorName":   color,
			"colorHex":    hex,
			"stock":       stockVal,
			"maxPerOrder": maxPer,
			"isActive":    active,
			"price":       price,
		})
	}
	return out, nil
}


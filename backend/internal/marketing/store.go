package marketing

import (
	"context"
	"database/sql"
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Slot struct {
	Key                   string `json:"key"`
	Label                 string `json:"label"`
	Description           string `json:"description"`
	ScreenshotDesktopURL  string `json:"screenshotDesktopUrl"`
	ScreenshotMobileURL   string `json:"screenshotMobileUrl"`
	AspectHintDesktop     string `json:"aspectHintDesktop"`
	AspectHintMobile      string `json:"aspectHintMobile"`
}

type Banner struct {
	ID                     uuid.UUID       `json:"id"`
	SlotKey                string          `json:"slotKey"`
	Title                  string          `json:"title"`
	Subtitle               string          `json:"subtitle"`
	CTALabel               string          `json:"ctaLabel"`
	CTAHref                string          `json:"ctaHref"`
	ImageDesktopURL        string          `json:"imageDesktopUrl"`
	ImageMobileURL         string          `json:"imageMobileUrl"`
	ObjectPositionDesktop  string          `json:"objectPositionDesktop"`
	ObjectPositionMobile   string          `json:"objectPositionMobile"`
	Copy                   json.RawMessage `json:"copy"`
	SortOrder              int             `json:"sortOrder"`
	IsActive               bool            `json:"isActive"`
	StartsAt               *time.Time      `json:"startsAt,omitempty"`
	EndsAt                 *time.Time      `json:"endsAt,omitempty"`
	CreatedAt              time.Time       `json:"createdAt"`
}

// DealBanner styles the thin top-of-store countdown strip.
type DealBanner struct {
	PreText      string `json:"preText"`
	LiveText     string `json:"liveText"`
	EndedText    string `json:"endedText"`
	CTALabel     string `json:"ctaLabel"`
	CTAHref      string `json:"ctaHref"`
	Background   string `json:"background"`
	TextColor    string `json:"textColor"`
	AccentColor  string `json:"accentColor"`
	ClockStyle   string `json:"clockStyle"` // blocks | inline | pills
	TextStyle    string `json:"textStyle"`  // bold | elegant | compact
	ShowSeconds  bool   `json:"showSeconds"`
}

func DefaultDealBanner() DealBanner {
	return DealBanner{
		PreText:     "Deal starts in",
		LiveText:    "Deal is live — ends in",
		EndedText:   "This deal has ended",
		CTALabel:    "Shop now",
		CTAHref:     "/shop",
		Background:  "#161412",
		TextColor:   "#FAF9F7",
		AccentColor: "#F38120",
		ClockStyle:  "blocks",
		TextStyle:   "bold",
		ShowSeconds: true,
	}
}

// DealGeoRule mirrors COD region rules: entire country or selected states.
type DealGeoRule struct {
	CountryIso  string   `json:"countryIso"`
	CountryName string   `json:"countryName"`
	Scope       string   `json:"scope"` // country | states
	States      []string `json:"states"`
	StateIsos   []string `json:"stateIsos,omitempty"`
}

type Deal struct {
	ID               uuid.UUID     `json:"id"`
	Title            string        `json:"title"`
	Slug             string        `json:"slug"`
	DiscountType     string        `json:"discountType"`
	DiscountValue    float64       `json:"discountValue"`
	Scope            string        `json:"scope"` // platform | category | products
	StartsAt         *time.Time    `json:"startsAt,omitempty"`
	EndsAt           *time.Time    `json:"endsAt,omitempty"`
	CountdownEnabled bool          `json:"countdownEnabled"`
	IsActive         bool          `json:"isActive"`
	GeoEverywhere    bool          `json:"geoEverywhere"`
	GeoRules         []DealGeoRule `json:"geoRules"`
	ProductIDs       []uuid.UUID   `json:"productIds"`
	CategoryIDs      []uuid.UUID   `json:"categoryIds"`
	Banner           DealBanner    `json:"banner"`
	EndsInSeconds    *int64        `json:"endsInSeconds,omitempty"`
	Phase            string        `json:"phase,omitempty"` // upcoming | live | ended
	TargetAt         *time.Time    `json:"targetAt,omitempty"`
}

type Store struct {
	DB *sql.DB
}

func (s *Store) EnsureSlots(ctx context.Context) error {
	slots := []Slot{
		{
			Key: "hero", Label: "Homepage Hero",
			Description: "Full-bleed hero slider at the top of the homepage. Upload desktop + mobile crops.",
			AspectHintDesktop: "≈ 21:9 wide", AspectHintMobile: "≈ 9:16 tall",
		},
		{
			Key: "promo_mid", Label: "Limited Collection Promo",
			Description: "Mid-page promo band (“BUILT FOR THE BOLD”) between Bestsellers and New Arrivals.",
			AspectHintDesktop: "≈ 3:1 wide", AspectHintMobile: "≈ 16:9",
		},
		{
			Key: "instagram", Label: "Instagram Strip",
			Description: "Optional dual image strip near the footer.",
			AspectHintDesktop: "square pair", AspectHintMobile: "square",
		},
	}
	for _, sl := range slots {
		_, err := s.DB.ExecContext(ctx, `
			INSERT INTO banner_slots (key, label, description, screenshot_desktop_url, screenshot_mobile_url, aspect_hint_desktop, aspect_hint_mobile)
			VALUES ($1,$2,$3,$4,$5,$6,$7)
			ON CONFLICT (key) DO UPDATE SET
				label=EXCLUDED.label, description=EXCLUDED.description,
				aspect_hint_desktop=EXCLUDED.aspect_hint_desktop, aspect_hint_mobile=EXCLUDED.aspect_hint_mobile`,
			sl.Key, sl.Label, sl.Description, sl.ScreenshotDesktopURL, sl.ScreenshotMobileURL, sl.AspectHintDesktop, sl.AspectHintMobile)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) ListSlots(ctx context.Context) ([]Slot, error) {
	rows, err := s.DB.QueryContext(ctx, `
		SELECT key, label, description, screenshot_desktop_url, screenshot_mobile_url, aspect_hint_desktop, aspect_hint_mobile
		FROM banner_slots ORDER BY key`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]Slot, 0)
	for rows.Next() {
		var sl Slot
		if err := rows.Scan(&sl.Key, &sl.Label, &sl.Description, &sl.ScreenshotDesktopURL, &sl.ScreenshotMobileURL, &sl.AspectHintDesktop, &sl.AspectHintMobile); err != nil {
			return nil, err
		}
		out = append(out, sl)
	}
	return out, rows.Err()
}

func (s *Store) ListBanners(ctx context.Context, slot string, activeOnly bool) ([]Banner, error) {
	q := `
		SELECT id, slot_key, title, subtitle, cta_label, cta_href, image_desktop_url, image_mobile_url,
			object_position_desktop, object_position_mobile, copy_json, sort_order, is_active, starts_at, ends_at, created_at
		FROM banners WHERE 1=1`
	args := []any{}
	if slot != "" {
		args = append(args, slot)
		q += ` AND slot_key=$1`
	}
	if activeOnly {
		q += ` AND is_active=TRUE AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW())`
	}
	q += ` ORDER BY sort_order ASC, created_at DESC`
	rows, err := s.DB.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]Banner, 0)
	for rows.Next() {
		var b Banner
		var copyBytes []byte
		if err := rows.Scan(&b.ID, &b.SlotKey, &b.Title, &b.Subtitle, &b.CTALabel, &b.CTAHref,
			&b.ImageDesktopURL, &b.ImageMobileURL, &b.ObjectPositionDesktop, &b.ObjectPositionMobile,
			&copyBytes, &b.SortOrder, &b.IsActive, &b.StartsAt, &b.EndsAt, &b.CreatedAt); err != nil {
			return nil, err
		}
		if len(copyBytes) == 0 {
			b.Copy = json.RawMessage(`{}`)
		} else {
			b.Copy = copyBytes
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

func (s *Store) SaveBanner(ctx context.Context, b *Banner) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	if b.Copy == nil {
		b.Copy = json.RawMessage(`{}`)
	}
	if b.ObjectPositionDesktop == "" {
		b.ObjectPositionDesktop = "center"
	}
	if b.ObjectPositionMobile == "" {
		b.ObjectPositionMobile = "center"
	}
	_, err := s.DB.ExecContext(ctx, `
		INSERT INTO banners (
			id, slot_key, title, subtitle, cta_label, cta_href, image_desktop_url, image_mobile_url,
			object_position_desktop, object_position_mobile, copy_json, sort_order, is_active, starts_at, ends_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
		ON CONFLICT (id) DO UPDATE SET
			slot_key=EXCLUDED.slot_key, title=EXCLUDED.title, subtitle=EXCLUDED.subtitle,
			cta_label=EXCLUDED.cta_label, cta_href=EXCLUDED.cta_href,
			image_desktop_url=EXCLUDED.image_desktop_url, image_mobile_url=EXCLUDED.image_mobile_url,
			object_position_desktop=EXCLUDED.object_position_desktop, object_position_mobile=EXCLUDED.object_position_mobile,
			copy_json=EXCLUDED.copy_json, sort_order=EXCLUDED.sort_order, is_active=EXCLUDED.is_active,
			starts_at=EXCLUDED.starts_at, ends_at=EXCLUDED.ends_at`,
		b.ID, b.SlotKey, b.Title, b.Subtitle, b.CTALabel, b.CTAHref, b.ImageDesktopURL, b.ImageMobileURL,
		b.ObjectPositionDesktop, b.ObjectPositionMobile, []byte(b.Copy), b.SortOrder, b.IsActive, b.StartsAt, b.EndsAt)
	return err
}

func (s *Store) DeleteBanner(ctx context.Context, id uuid.UUID) error {
	var copyBytes []byte
	err := s.DB.QueryRowContext(ctx, `SELECT copy_json FROM banners WHERE id=$1`, id).Scan(&copyBytes)
	if err == sql.ErrNoRows {
		return err
	}
	if err != nil {
		return err
	}
	var meta map[string]any
	_ = json.Unmarshal(copyBytes, &meta)
	if locked, ok := meta["locked"].(bool); ok && locked {
		return errBannerLocked
	}
	_, err = s.DB.ExecContext(ctx, `DELETE FROM banners WHERE id=$1`, id)
	return err
}

var errBannerLocked = jsonError("system banners cannot be deleted")

type jsonError string

func (e jsonError) Error() string { return string(e) }

// LockDefaultBanners marks seeded hero/promo rows as non-deletable and
// points their images at the storefront public assets when possible.
func (s *Store) LockDefaultBanners(ctx context.Context) error {
	rows, err := s.DB.QueryContext(ctx, `
		SELECT id, image_desktop_url, image_mobile_url, copy_json
		FROM banners
		WHERE slot_key IN ('hero','promo_mid')`)
	if err != nil {
		return err
	}
	defer rows.Close()

	type row struct {
		id                 uuid.UUID
		desk, mob          string
		copy               []byte
	}
	var list []row
	for rows.Next() {
		var r row
		if err := rows.Scan(&r.id, &r.desk, &r.mob, &r.copy); err != nil {
			return err
		}
		list = append(list, r)
	}
	if err := rows.Err(); err != nil {
		return err
	}

	localise := func(url string) string {
		base := filepath.Base(strings.Split(url, "?")[0])
		switch base {
		case "hero_desktop_1.webp", "hero_desktop_2.webp", "hero_desktop_3.webp",
			"hero_mobile_1.webp", "hero_mobile_2.webp", "hero_mobile_3.webp",
			"promo.webp":
			return "/images/banners/" + base
		default:
			return url
		}
	}

	for _, r := range list {
		meta := map[string]any{}
		_ = json.Unmarshal(r.copy, &meta)
		meta["locked"] = true
		raw, err := json.Marshal(meta)
		if err != nil {
			return err
		}
		desk := localise(r.desk)
		mob := localise(r.mob)
		if _, err := s.DB.ExecContext(ctx, `
			UPDATE banners
			SET image_desktop_url=$2, image_mobile_url=$3, copy_json=$4
			WHERE id=$1`, r.id, desk, mob, raw); err != nil {
			return err
		}
	}
	return nil
}

// EnsureDefaultBanners seeds the storefront hero + promo when the table is empty.
// Images are copied from seedDir into uploadDir/banners/.
func (s *Store) EnsureDefaultBanners(ctx context.Context, uploadDir, publicBase, seedDir string) error {
	var n int
	if err := s.DB.QueryRowContext(ctx, `SELECT COUNT(*) FROM banners`).Scan(&n); err != nil {
		return err
	}
	if n > 0 {
		return nil
	}

	destDir := filepath.Join(uploadDir, "banners")
	if err := os.MkdirAll(destDir, 0o755); err != nil {
		return err
	}

	copySeed := func(name string) (string, error) {
		src := filepath.Join(seedDir, name)
		dst := filepath.Join(destDir, name)
		if err := copyFile(src, dst); err != nil {
			return "", err
		}
		return strings.TrimRight(publicBase, "/") + "/uploads/banners/" + name, nil
	}

	type draft struct {
		slot, title, subtitle, cta, href, desktop, mobile, posD, posM string
		sort                                                         int
		copy                                                         map[string]any
	}

	drafts := []draft{
		{
			slot: "hero", title: "Wear Your Wild Side", subtitle: "Bold Outfits. Fierce Personality. Made for the Unstoppable You.",
			cta: "Shop Now", href: "/shop", desktop: "hero_desktop_1.webp", mobile: "hero_mobile_1.webp",
			posD: "right center", posM: "center 35%", sort: 0,
			copy: map[string]any{
				"eyebrow": "Tigerteeh Clothing", "lead": "WEAR YOUR", "accent": "WILD", "trail": "SIDE",
				"subtitle": "Bold Outfits. Fierce Personality. Made for the Unstoppable You.",
				"script": "More Than Clothing", "scriptPos": "right-[5%] top-[13%]",
				"cta": "Shop Now", "secondary": "Watch Video", "lightVeil": true, "align": "left",
				"locked": true,
			},
		},
		{
			slot: "hero", title: "King of the Jungle", subtitle: "Tiger, parrot, leopard. Every print tells your story.",
			cta: "Explore Collection", href: "/shop", desktop: "hero_desktop_2.webp", mobile: "hero_mobile_2.webp",
			posD: "center 40%", posM: "center 28%", sort: 1,
			copy: map[string]any{
				"eyebrow": "Signature Prints", "lead": "KING OF THE", "accent": "JUNGLE", "trail": "",
				"subtitle": "Tiger, parrot, leopard. Every print tells your story.",
				"script": "Wild By Nature", "scriptPos": "right-[4%] top-[38%]",
				"cta": "Explore Collection", "secondary": "See Lookbook", "align": "left",
				"locked": true,
			},
		},
		{
			slot: "hero", title: "Straight To Your Door", subtitle: "Worldwide in 10–12 days. India within 7 days.",
			cta: "Shop Now", href: "/shop", desktop: "hero_desktop_3.webp", mobile: "hero_mobile_3.webp",
			posD: "center 45%", posM: "center 32%", sort: 2,
			copy: map[string]any{
				"eyebrow": "Worldwide Delivery", "lead": "STRAIGHT TO", "accent": "YOUR", "trail": "DOOR",
				"subtitle": "Worldwide in 10–12 days. India within 7 days.",
				"script": "Fast & Fierce", "scriptPos": "left-[5%] top-[16%]",
				"cta": "Shop Now", "secondary": "Track Order", "align": "right",
				"locked": true,
			},
		},
		{
			slot: "promo_mid", title: "Limited Collection", subtitle: "Step into a collection that stands out.",
			cta: "Explore Collection", href: "/shop", desktop: "promo.webp", mobile: "promo.webp",
			posD: "center top", posM: "center top", sort: 0,
			copy: map[string]any{
				"eyebrow": "Limited Collection", "lead": "BUILT FOR", "accent": "THE BOLD",
				"subtitle": "Step into a collection that stands out.",
				"cta": "Explore Collection", "align": "left",
				"words": []string{"FASHION", "COURAGE", "FREEDOM", "YOU"},
				"locked": true,
			},
		},
	}

	for _, d := range drafts {
		// Keep a copy in uploads for admin tools, but storefront uses public paths.
		if _, err := copySeed(d.desktop); err != nil {
			return err
		}
		if d.mobile != d.desktop {
			if _, err := copySeed(d.mobile); err != nil {
				return err
			}
		}
		raw, err := json.Marshal(d.copy)
		if err != nil {
			return err
		}
		b := &Banner{
			SlotKey:               d.slot,
			Title:                 d.title,
			Subtitle:              d.subtitle,
			CTALabel:              d.cta,
			CTAHref:               d.href,
			ImageDesktopURL:       "/images/banners/" + d.desktop,
			ImageMobileURL:        "/images/banners/" + d.mobile,
			ObjectPositionDesktop: d.posD,
			ObjectPositionMobile:  d.posM,
			Copy:                  raw,
			SortOrder:             d.sort,
			IsActive:              true,
		}
		if err := s.SaveBanner(ctx, b); err != nil {
			return err
		}
	}
	return nil
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	return err
}

func scanDealRow(scanner interface {
	Scan(dest ...any) error
}) (Deal, []byte, []byte, error) {
	var d Deal
	var bannerRaw []byte
	var geoRaw []byte
	var scope sql.NullString
	d.Banner = DefaultDealBanner()
	d.ProductIDs = []uuid.UUID{}
	d.CategoryIDs = []uuid.UUID{}
	d.GeoRules = []DealGeoRule{}
	d.GeoEverywhere = true
	err := scanner.Scan(
		&d.ID, &d.Title, &d.Slug, &d.DiscountType, &d.DiscountValue,
		&scope, &d.StartsAt, &d.EndsAt, &d.CountdownEnabled, &d.IsActive,
		&bannerRaw, &d.GeoEverywhere, &geoRaw,
	)
	if err != nil {
		return d, nil, nil, err
	}
	if scope.Valid && scope.String != "" {
		d.Scope = scope.String
	} else {
		d.Scope = "platform"
	}
	return d, bannerRaw, geoRaw, nil
}

func hydrateDeal(d *Deal, bannerRaw []byte, geoRaw []byte) {
	d.Banner = DefaultDealBanner()
	if len(bannerRaw) > 0 && string(bannerRaw) != "{}" && string(bannerRaw) != "null" {
		_ = json.Unmarshal(bannerRaw, &d.Banner)
	}
	if d.GeoRules == nil {
		d.GeoRules = []DealGeoRule{}
	}
	if len(geoRaw) > 0 && string(geoRaw) != "null" {
		_ = json.Unmarshal(geoRaw, &d.GeoRules)
	}
	if d.GeoRules == nil {
		d.GeoRules = []DealGeoRule{}
	}
	if d.Scope == "" {
		d.Scope = "platform"
	}
	if d.DiscountType == "" {
		d.DiscountType = "percent"
	}
	enrichDealPhase(d, time.Now())
}

func normGeo(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}

// DealMatchesGeo returns true when the shopper country/state is eligible.
// Empty country → only everywhere deals (safe default before location is known).
func DealMatchesGeo(d Deal, countryIso, countryName, stateName string) bool {
	if d.GeoEverywhere {
		return true
	}
	cIso := normGeo(countryIso)
	cName := normGeo(countryName)
	st := normGeo(stateName)
	if cIso == "" && cName == "" {
		return false
	}
	for _, rule := range d.GeoRules {
		ruleIso := normGeo(rule.CountryIso)
		ruleName := normGeo(rule.CountryName)
		matchCountry :=
			(ruleIso != "" && (cIso == ruleIso || cName == ruleIso)) ||
				(ruleName != "" && (cName == ruleName || strings.Contains(cName, ruleName) || strings.Contains(ruleName, cName)))
		if !matchCountry {
			continue
		}
		if rule.Scope != "states" {
			return true
		}
		for _, allowed := range rule.States {
			a := normGeo(allowed)
			if a != "" && (st == a || strings.Contains(st, a) || strings.Contains(a, st)) {
				return true
			}
		}
		for _, iso := range rule.StateIsos {
			if st != "" && st == normGeo(iso) {
				return true
			}
		}
	}
	return false
}

func filterDealsByGeo(list []Deal, countryIso, countryName, stateName string) []Deal {
	out := make([]Deal, 0, len(list))
	for _, d := range list {
		if DealMatchesGeo(d, countryIso, countryName, stateName) {
			out = append(out, d)
		}
	}
	return out
}

func enrichDealPhase(d *Deal, now time.Time) {
	d.Phase = "live"
	d.TargetAt = nil
	d.EndsInSeconds = nil

	if d.StartsAt != nil && now.Before(*d.StartsAt) {
		d.Phase = "upcoming"
		d.TargetAt = d.StartsAt
	} else if d.EndsAt != nil && !now.Before(*d.EndsAt) {
		d.Phase = "ended"
	} else {
		d.Phase = "live"
		if d.EndsAt != nil {
			d.TargetAt = d.EndsAt
		}
	}

	if d.CountdownEnabled && d.TargetAt != nil {
		sec := int64(d.TargetAt.Sub(now).Seconds())
		if sec < 0 {
			sec = 0
		}
		d.EndsInSeconds = &sec
	}
}

func (s *Store) attachDealLinks(ctx context.Context, d *Deal) error {
	pids, err := s.dealProductIDs(ctx, d.ID)
	if err != nil {
		return err
	}
	d.ProductIDs = pids
	cids, err := s.dealCategoryIDs(ctx, d.ID)
	if err != nil {
		return err
	}
	d.CategoryIDs = cids
	return nil
}

const dealSelectCols = `id, title, slug, discount_type, discount_value, scope, starts_at, ends_at, countdown_enabled, is_active, banner_json, COALESCE(geo_everywhere, TRUE), COALESCE(geo_json, '[]'::jsonb)`

func (s *Store) ListActiveDeals(ctx context.Context, countryIso, countryName, stateName string) ([]Deal, error) {
	rows, err := s.DB.QueryContext(ctx, `
		SELECT `+dealSelectCols+`
		FROM deals
		WHERE is_active=TRUE
			AND (starts_at IS NULL OR starts_at <= NOW())
			AND (ends_at IS NULL OR ends_at >= NOW())
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]Deal, 0)
	for rows.Next() {
		d, bannerRaw, geoRaw, err := scanDealRow(rows)
		if err != nil {
			return nil, err
		}
		hydrateDeal(&d, bannerRaw, geoRaw)
		if err := s.attachDealLinks(ctx, &d); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return filterDealsByGeo(out, countryIso, countryName, stateName), nil
}

// GetDealBanner returns the top strip deal (upcoming or live), if any.
func (s *Store) GetDealBanner(ctx context.Context, countryIso, countryName, stateName string) (*Deal, error) {
	rows, err := s.DB.QueryContext(ctx, `
		SELECT `+dealSelectCols+`
		FROM deals
		WHERE is_active=TRUE
			AND countdown_enabled=TRUE
			AND (ends_at IS NULL OR ends_at >= NOW())
		ORDER BY
			CASE WHEN starts_at IS NOT NULL AND starts_at > NOW() THEN 0 ELSE 1 END,
			starts_at NULLS LAST,
			created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		d, bannerRaw, geoRaw, err := scanDealRow(rows)
		if err != nil {
			return nil, err
		}
		hydrateDeal(&d, bannerRaw, geoRaw)
		if d.Phase == "ended" {
			continue
		}
		if !DealMatchesGeo(d, countryIso, countryName, stateName) {
			continue
		}
		if err := s.attachDealLinks(ctx, &d); err != nil {
			return nil, err
		}
		return &d, nil
	}
	return nil, rows.Err()
}

func (s *Store) ListDeals(ctx context.Context) ([]Deal, error) {
	rows, err := s.DB.QueryContext(ctx, `
		SELECT `+dealSelectCols+`
		FROM deals ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]Deal, 0)
	for rows.Next() {
		d, bannerRaw, geoRaw, err := scanDealRow(rows)
		if err != nil {
			return nil, err
		}
		hydrateDeal(&d, bannerRaw, geoRaw)
		if err := s.attachDealLinks(ctx, &d); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func (s *Store) dealProductIDs(ctx context.Context, dealID uuid.UUID) ([]uuid.UUID, error) {
	rows, err := s.DB.QueryContext(ctx, `SELECT product_id FROM deal_products WHERE deal_id=$1`, dealID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (s *Store) dealCategoryIDs(ctx context.Context, dealID uuid.UUID) ([]uuid.UUID, error) {
	rows, err := s.DB.QueryContext(ctx, `SELECT category_id FROM deal_categories WHERE deal_id=$1`, dealID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (s *Store) SaveDeal(ctx context.Context, d *Deal) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	if d.Scope == "" {
		d.Scope = "platform"
	}
	if d.Scope != "platform" && d.Scope != "category" && d.Scope != "products" {
		d.Scope = "platform"
	}
	if d.Banner.Background == "" {
		d.Banner = DefaultDealBanner()
	}
	if d.ProductIDs == nil {
		d.ProductIDs = []uuid.UUID{}
	}
	if d.CategoryIDs == nil {
		d.CategoryIDs = []uuid.UUID{}
	}
	if d.GeoRules == nil {
		d.GeoRules = []DealGeoRule{}
	}
	bannerRaw, err := json.Marshal(d.Banner)
	if err != nil {
		return err
	}
	geoRaw, err := json.Marshal(d.GeoRules)
	if err != nil {
		return err
	}

	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	_, err = tx.ExecContext(ctx, `
		INSERT INTO deals (id, title, slug, discount_type, discount_value, scope, starts_at, ends_at, countdown_enabled, is_active, banner_json, geo_everywhere, geo_json)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
		ON CONFLICT (id) DO UPDATE SET
			title=EXCLUDED.title, slug=EXCLUDED.slug, discount_type=EXCLUDED.discount_type,
			discount_value=EXCLUDED.discount_value, scope=EXCLUDED.scope,
			starts_at=EXCLUDED.starts_at, ends_at=EXCLUDED.ends_at,
			countdown_enabled=EXCLUDED.countdown_enabled, is_active=EXCLUDED.is_active,
			banner_json=EXCLUDED.banner_json, geo_everywhere=EXCLUDED.geo_everywhere,
			geo_json=EXCLUDED.geo_json`,
		d.ID, d.Title, d.Slug, d.DiscountType, d.DiscountValue, d.Scope,
		d.StartsAt, d.EndsAt, d.CountdownEnabled, d.IsActive, bannerRaw,
		d.GeoEverywhere, geoRaw)
	if err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM deal_products WHERE deal_id=$1`, d.ID); err != nil {
		return err
	}
	if d.Scope == "products" {
		for _, pid := range d.ProductIDs {
			if _, err := tx.ExecContext(ctx, `INSERT INTO deal_products (deal_id, product_id) VALUES ($1,$2)`, d.ID, pid); err != nil {
				return err
			}
		}
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM deal_categories WHERE deal_id=$1`, d.ID); err != nil {
		return err
	}
	if d.Scope == "category" {
		for _, cid := range d.CategoryIDs {
			if _, err := tx.ExecContext(ctx, `INSERT INTO deal_categories (deal_id, category_id) VALUES ($1,$2)`, d.ID, cid); err != nil {
				return err
			}
		}
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	hydrateDeal(d, bannerRaw, geoRaw)
	return nil
}

func (s *Store) DeleteDeal(ctx context.Context, id uuid.UUID) error {
	_, err := s.DB.ExecContext(ctx, `DELETE FROM deals WHERE id=$1`, id)
	return err
}

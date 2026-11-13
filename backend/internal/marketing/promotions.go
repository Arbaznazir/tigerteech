package marketing

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Promotion struct {
	ID               uuid.UUID   `json:"id"`
	Kind             string      `json:"kind"` // coupon | promo | offer
	Code             string      `json:"code"`
	Title            string      `json:"title"`
	Description      string      `json:"description"`
	DiscountType     string      `json:"discountType"` // percent | fixed | gift_threshold
	DiscountValue    float64     `json:"discountValue"`
	Scope            string      `json:"scope"` // cart | product
	MinSubtotal      float64     `json:"minSubtotal"`
	GiftProductID    *uuid.UUID  `json:"giftProductId,omitempty"`
	UsageLimitType   string      `json:"usageLimitType"` // unlimited | once_per_user | first_n
	UsageLimitCount  int         `json:"usageLimitCount"`
	RedemptionCount  int         `json:"redemptionCount"`
	CardStyle        string      `json:"cardStyle"` // ember | aurora | stripe | spark | midnight | gold
	StartsAt         *time.Time  `json:"startsAt,omitempty"`
	EndsAt           *time.Time  `json:"endsAt,omitempty"`
	IsActive         bool        `json:"isActive"`
	ProductIDs       []uuid.UUID `json:"productIds"`
	GiftProductName  string      `json:"giftProductName,omitempty"`
	GiftProductImage string      `json:"giftProductImage,omitempty"`
	CreatedAt        time.Time   `json:"createdAt"`
	UpdatedAt        time.Time   `json:"updatedAt"`
}

const promoSelectCols = `id, kind, code, title, description, discount_type, discount_value, scope,
			min_subtotal, gift_product_id, usage_limit_type, usage_limit_count, redemption_count,
			COALESCE(NULLIF(card_style, ''), 'ember'), starts_at, ends_at, is_active, created_at, updated_at`

func normalizeCardStyle(s string) string {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "aurora", "stripe", "spark", "midnight", "gold":
		return strings.ToLower(strings.TrimSpace(s))
	default:
		return "ember"
	}
}

type PromoQuoteInput struct {
	Code          string
	Subtotal      float64
	ProductIDs    []uuid.UUID
	ProductTotals map[uuid.UUID]float64
	UserID        *uuid.UUID
}

type PromoQuoteResult struct {
	OK              bool       `json:"ok"`
	PromotionID     *uuid.UUID `json:"promotionId,omitempty"`
	Code            string     `json:"code"`
	Title           string     `json:"title"`
	Kind            string     `json:"kind"`
	DiscountType    string     `json:"discountType"`
	Discount        float64    `json:"discount"`
	DiscountLabel   string     `json:"discountLabel"`
	GiftProductID   *uuid.UUID `json:"giftProductId,omitempty"`
	GiftProductName string     `json:"giftProductName,omitempty"`
	Message         string     `json:"message,omitempty"`
}

func (s *Store) ListPromotions(ctx context.Context, activeOnly bool) ([]Promotion, error) {
	q := `
		SELECT ` + promoSelectCols + `
		FROM promotions`
	if activeOnly {
		q += ` WHERE is_active=TRUE
			AND (starts_at IS NULL OR starts_at <= NOW())
			AND (ends_at IS NULL OR ends_at >= NOW())`
	}
	q += ` ORDER BY created_at DESC`
	rows, err := s.DB.QueryContext(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []Promotion{}
	for rows.Next() {
		p, err := scanPromotion(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	for i := range out {
		ids, _ := s.promotionProductIDs(ctx, out[i].ID)
		out[i].ProductIDs = ids
		s.attachGiftMeta(ctx, &out[i])
	}
	return out, nil
}

func (s *Store) GetPromotion(ctx context.Context, id uuid.UUID) (*Promotion, error) {
	row := s.DB.QueryRowContext(ctx, `
		SELECT `+promoSelectCols+`
		FROM promotions WHERE id=$1`, id)
	p, err := scanPromotion(row)
	if err != nil {
		return nil, err
	}
	p.ProductIDs, _ = s.promotionProductIDs(ctx, p.ID)
	s.attachGiftMeta(ctx, &p)
	return &p, nil
}

func (s *Store) UpsertPromotion(ctx context.Context, p *Promotion) error {
	if strings.TrimSpace(p.Title) == "" {
		return errors.New("title required")
	}
	p.Kind = strings.ToLower(strings.TrimSpace(p.Kind))
	if p.Kind == "" {
		p.Kind = "coupon"
	}
	p.Code = strings.ToUpper(strings.TrimSpace(p.Code))
	p.DiscountType = strings.ToLower(strings.TrimSpace(p.DiscountType))
	if p.DiscountType == "" {
		p.DiscountType = "percent"
	}
	p.Scope = strings.ToLower(strings.TrimSpace(p.Scope))
	if p.Scope == "" {
		p.Scope = "cart"
	}
	p.UsageLimitType = strings.ToLower(strings.TrimSpace(p.UsageLimitType))
	if p.UsageLimitType == "" || p.UsageLimitType == "all_users" {
		p.UsageLimitType = "unlimited"
	}
	switch p.UsageLimitType {
	case "unlimited", "once_per_user", "first_n":
	default:
		return errors.New("usage limit must be unlimited, once_per_user, or first_n")
	}
	if p.DiscountType == "gift_threshold" && p.GiftProductID == nil {
		return errors.New("gift product required for threshold offers")
	}
	if (p.Kind == "coupon" || p.Kind == "promo") && p.Code == "" && p.DiscountType != "gift_threshold" {
		return errors.New("code required for coupons and promos")
	}
	p.CardStyle = normalizeCardStyle(p.CardStyle)
	now := time.Now()
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
		p.CreatedAt = now
	}
	p.UpdatedAt = now

	_, err := s.DB.ExecContext(ctx, `
		INSERT INTO promotions (
			id, kind, code, title, description, discount_type, discount_value, scope,
			min_subtotal, gift_product_id, usage_limit_type, usage_limit_count, redemption_count,
			card_style, starts_at, ends_at, is_active, created_at, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
		ON CONFLICT (id) DO UPDATE SET
			kind=EXCLUDED.kind, code=EXCLUDED.code, title=EXCLUDED.title, description=EXCLUDED.description,
			discount_type=EXCLUDED.discount_type, discount_value=EXCLUDED.discount_value, scope=EXCLUDED.scope,
			min_subtotal=EXCLUDED.min_subtotal, gift_product_id=EXCLUDED.gift_product_id,
			usage_limit_type=EXCLUDED.usage_limit_type, usage_limit_count=EXCLUDED.usage_limit_count,
			card_style=EXCLUDED.card_style,
			starts_at=EXCLUDED.starts_at, ends_at=EXCLUDED.ends_at, is_active=EXCLUDED.is_active,
			updated_at=EXCLUDED.updated_at`,
		p.ID, p.Kind, p.Code, p.Title, p.Description, p.DiscountType, p.DiscountValue, p.Scope,
		p.MinSubtotal, p.GiftProductID, p.UsageLimitType, p.UsageLimitCount, p.RedemptionCount,
		p.CardStyle, p.StartsAt, p.EndsAt, p.IsActive, p.CreatedAt, p.UpdatedAt)
	if err != nil {
		return err
	}

	if _, err := s.DB.ExecContext(ctx, `DELETE FROM promotion_products WHERE promotion_id=$1`, p.ID); err != nil {
		return err
	}
	for _, pid := range p.ProductIDs {
		if _, err := s.DB.ExecContext(ctx, `
			INSERT INTO promotion_products (promotion_id, product_id) VALUES ($1,$2)
			ON CONFLICT DO NOTHING`, p.ID, pid); err != nil {
			return err
		}
	}

	if p.GiftProductID != nil {
		_, _ = s.DB.ExecContext(ctx, `
			UPDATE products SET listing_visibility='offer_gift' WHERE id=$1`, *p.GiftProductID)
	}
	return nil
}

func (s *Store) DeletePromotion(ctx context.Context, id uuid.UUID) error {
	_, err := s.DB.ExecContext(ctx, `DELETE FROM promotions WHERE id=$1`, id)
	return err
}

func (s *Store) FindPromotionByCode(ctx context.Context, code string) (*Promotion, error) {
	code = strings.ToUpper(strings.TrimSpace(code))
	if code == "" {
		return nil, errors.New("code required")
	}
	row := s.DB.QueryRowContext(ctx, `
		SELECT `+promoSelectCols+`
		FROM promotions
		WHERE LOWER(code)=LOWER($1)`, code)
	p, err := scanPromotion(row)
	if err != nil {
		return nil, errors.New("invalid promo code")
	}
	p.ProductIDs, _ = s.promotionProductIDs(ctx, p.ID)
	s.attachGiftMeta(ctx, &p)
	return &p, nil
}

func (s *Store) QuotePromotion(ctx context.Context, in PromoQuoteInput) (*PromoQuoteResult, error) {
	p, err := s.FindPromotionByCode(ctx, in.Code)
	if err != nil {
		return &PromoQuoteResult{OK: false, Message: err.Error()}, nil
	}
	return s.evaluatePromotion(ctx, p, in)
}

func (s *Store) evaluatePromotion(ctx context.Context, p *Promotion, in PromoQuoteInput) (*PromoQuoteResult, error) {
	now := time.Now()
	if !p.IsActive {
		return &PromoQuoteResult{OK: false, Message: "This offer is not active"}, nil
	}
	if p.StartsAt != nil && p.StartsAt.After(now) {
		return &PromoQuoteResult{OK: false, Message: "This offer has not started yet"}, nil
	}
	if p.EndsAt != nil && p.EndsAt.Before(now) {
		return &PromoQuoteResult{OK: false, Message: "This offer has ended"}, nil
	}
	if p.UsageLimitType == "first_n" && p.UsageLimitCount > 0 && p.RedemptionCount >= p.UsageLimitCount {
		return &PromoQuoteResult{OK: false, Message: "This offer has reached its usage limit"}, nil
	}
	if errMsg := s.checkPerUserUsage(ctx, p, in.UserID); errMsg != "" {
		return &PromoQuoteResult{OK: false, Message: errMsg}, nil
	}
	if in.Subtotal < p.MinSubtotal {
		return &PromoQuoteResult{
			OK:      false,
			Message: "Cart does not meet the minimum spend for this offer",
		}, nil
	}

	eligibleBase := in.Subtotal
	applies := p.Scope == "cart" || p.DiscountType == "gift_threshold"
	if p.Scope == "product" {
		allowed := map[uuid.UUID]bool{}
		for _, id := range p.ProductIDs {
			allowed[id] = true
		}
		eligibleBase = 0
		for _, id := range in.ProductIDs {
			if allowed[id] {
				applies = true
				if in.ProductTotals != nil {
					eligibleBase += in.ProductTotals[id]
				}
			}
		}
		if applies && eligibleBase <= 0 {
			eligibleBase = in.Subtotal
		}
	}
	if !applies {
		return &PromoQuoteResult{OK: false, Message: "This code does not apply to items in your bag"}, nil
	}

	out := &PromoQuoteResult{
		OK:            true,
		PromotionID:   &p.ID,
		Code:          p.Code,
		Title:         p.Title,
		Kind:          p.Kind,
		DiscountType:  p.DiscountType,
		GiftProductID: p.GiftProductID,
	}

	switch p.DiscountType {
	case "fixed":
		out.Discount = p.DiscountValue
		if out.Discount > eligibleBase {
			out.Discount = eligibleBase
		}
		out.DiscountLabel = p.Title
	case "percent":
		out.Discount = eligibleBase * (p.DiscountValue / 100)
		if out.Discount > eligibleBase {
			out.Discount = eligibleBase
		}
		out.DiscountLabel = p.Title
	case "gift_threshold":
		out.Discount = 0
		out.DiscountLabel = p.Title
		out.GiftProductName = p.GiftProductName
		if p.GiftProductID == nil {
			return &PromoQuoteResult{OK: false, Message: "Gift offer is misconfigured"}, nil
		}
	default:
		return &PromoQuoteResult{OK: false, Message: "Unsupported offer type"}, nil
	}

	out.Message = "Offer applied"
	return out, nil
}

func (s *Store) RecordPromotionRedemption(ctx context.Context, tx *sql.Tx, promoID uuid.UUID, userID *uuid.UUID, orderID uuid.UUID, code string, discount float64) error {
	exec := s.DB.ExecContext
	if tx != nil {
		exec = tx.ExecContext
	}
	_, err := exec(ctx, `
		INSERT INTO promotion_redemptions (id, promotion_id, user_id, order_id, code, discount_amount)
		VALUES ($1,$2,$3,$4,$5,$6)`,
		uuid.New(), promoID, userID, orderID, strings.ToUpper(strings.TrimSpace(code)), discount)
	if err != nil {
		return err
	}
	_, err = exec(ctx, `UPDATE promotions SET redemption_count=redemption_count+1, updated_at=NOW() WHERE id=$1`, promoID)
	return err
}

func (s *Store) ListActiveOffersPublic(ctx context.Context, userID *uuid.UUID) ([]Promotion, error) {
	list, err := s.ListPromotions(ctx, true)
	if err != nil {
		return nil, err
	}
	out := make([]Promotion, 0, len(list))
	for _, p := range list {
		if !(p.Kind == "offer" || p.DiscountType == "gift_threshold" || p.Code != "") {
			continue
		}
		if s.shouldHideForUser(ctx, &p, userID) {
			continue
		}
		out = append(out, p)
	}
	return out, nil
}

func (s *Store) ListProductPromotions(ctx context.Context, productID uuid.UUID, userID *uuid.UUID) ([]Promotion, error) {
	rows, err := s.DB.QueryContext(ctx, `
		SELECT p.id, p.kind, p.code, p.title, p.description, p.discount_type, p.discount_value, p.scope,
			p.min_subtotal, p.gift_product_id, p.usage_limit_type, p.usage_limit_count, p.redemption_count,
			COALESCE(NULLIF(p.card_style, ''), 'ember'), p.starts_at, p.ends_at, p.is_active, p.created_at, p.updated_at
		FROM promotions p
		JOIN promotion_products pp ON pp.promotion_id=p.id
		WHERE pp.product_id=$1 AND p.is_active=TRUE
			AND (p.starts_at IS NULL OR p.starts_at <= NOW())
			AND (p.ends_at IS NULL OR p.ends_at >= NOW())
		ORDER BY p.created_at DESC`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Promotion{}
	for rows.Next() {
		p, err := scanPromotion(rows)
		if err != nil {
			return nil, err
		}
		if s.shouldHideForUser(ctx, &p, userID) {
			continue
		}
		out = append(out, p)
	}
	return out, nil
}

// once_per_user and first_n are one redemption per customer.
func (s *Store) userAlreadyRedeemed(ctx context.Context, promoID uuid.UUID, userID uuid.UUID) bool {
	var n int
	err := s.DB.QueryRowContext(ctx, `
		SELECT COUNT(1) FROM promotion_redemptions
		WHERE promotion_id=$1 AND user_id=$2`, promoID, userID).Scan(&n)
	return err == nil && n > 0
}

func (s *Store) checkPerUserUsage(ctx context.Context, p *Promotion, userID *uuid.UUID) string {
	needsOnce := p.UsageLimitType == "once_per_user" || p.UsageLimitType == "first_n"
	if !needsOnce {
		return ""
	}
	if userID == nil {
		return "Log in to use this offer"
	}
	if s.userAlreadyRedeemed(ctx, p.ID, *userID) {
		return "You have already used this offer"
	}
	return ""
}

func (s *Store) shouldHideForUser(ctx context.Context, p *Promotion, userID *uuid.UUID) bool {
	if userID == nil {
		return false
	}
	needsOnce := p.UsageLimitType == "once_per_user" || p.UsageLimitType == "first_n"
	if !needsOnce {
		return false
	}
	return s.userAlreadyRedeemed(ctx, p.ID, *userID)
}

type promoScanner interface {
	Scan(dest ...any) error
}

func scanPromotion(row promoScanner) (Promotion, error) {
	var p Promotion
	var gift *uuid.UUID
	var starts, ends sql.NullTime
	err := row.Scan(
		&p.ID, &p.Kind, &p.Code, &p.Title, &p.Description, &p.DiscountType, &p.DiscountValue, &p.Scope,
		&p.MinSubtotal, &gift, &p.UsageLimitType, &p.UsageLimitCount, &p.RedemptionCount,
		&p.CardStyle, &starts, &ends, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return p, err
	}
	p.GiftProductID = gift
	p.CardStyle = normalizeCardStyle(p.CardStyle)
	if starts.Valid {
		t := starts.Time
		p.StartsAt = &t
	}
	if ends.Valid {
		t := ends.Time
		p.EndsAt = &t
	}
	if p.ProductIDs == nil {
		p.ProductIDs = []uuid.UUID{}
	}
	return p, nil
}

func (s *Store) promotionProductIDs(ctx context.Context, promoID uuid.UUID) ([]uuid.UUID, error) {
	rows, err := s.DB.QueryContext(ctx, `SELECT product_id FROM promotion_products WHERE promotion_id=$1`, promoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ids := []uuid.UUID{}
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

func (s *Store) attachGiftMeta(ctx context.Context, p *Promotion) {
	if p.GiftProductID == nil {
		return
	}
	var name, img string
	err := s.DB.QueryRowContext(ctx, `
		SELECT p.name, COALESCE((
			SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order ASC LIMIT 1
		),'')
		FROM products p WHERE p.id=$1`, *p.GiftProductID).Scan(&name, &img)
	if err == nil {
		p.GiftProductName = name
		p.GiftProductImage = img
	}
}

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

type OrderItemInput struct {
	VariantID             uuid.UUID       `json:"variantId"`
	Qty                   int             `json:"qty"`
	ExpectedUnitPrice     *float64        `json:"expectedUnitPrice,omitempty"`
	MeasurementSnapshot   json.RawMessage `json:"measurementSnapshot,omitempty"`
}

type OrderInput struct {
	Email               string           `json:"email"`
	Shipping            json.RawMessage  `json:"shipping"`
	MeasurementSnapshot json.RawMessage  `json:"measurementSnapshot"`
	Items               []OrderItemInput `json:"items"`
	PaymentMethod       string           `json:"paymentMethod"` // cod | online
	CouponCode          string           `json:"couponCode"`
	DealID              *uuid.UUID       `json:"dealId,omitempty"`
	ExpectedSubtotal    *float64         `json:"expectedSubtotal,omitempty"`
	ExpectedTotal       *float64         `json:"expectedTotal,omitempty"`
	ExpectedPaidAmount  *float64         `json:"expectedPaidAmount,omitempty"`
}

type PriceMismatchLine struct {
	VariantID         uuid.UUID `json:"variantId"`
	ProductName       string    `json:"productName"`
	MaterialName      string    `json:"materialName"`
	ColorName         string    `json:"colorName"`
	Qty               int       `json:"qty"`
	ExpectedUnitPrice float64   `json:"expectedUnitPrice"`
	CurrentUnitPrice  float64   `json:"currentUnitPrice"`
}

// PriceMismatchError is returned when the client cart total/unit price
// does not match live backend pricing. Payment must use CurrentTotal.
type PriceMismatchError struct {
	Message          string              `json:"message"`
	ExpectedSubtotal float64             `json:"expectedSubtotal"`
	CurrentSubtotal  float64             `json:"currentSubtotal"`
	ExpectedTotal    float64             `json:"expectedTotal"`
	CurrentTotal     float64             `json:"currentTotal"`
	Shipping         float64             `json:"shipping"`
	Discount         float64             `json:"discount"`
	Lines            []PriceMismatchLine `json:"lines"`
}

func (e *PriceMismatchError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return fmt.Sprintf("price changed — you must pay $%.2f (not $%.2f)", e.CurrentTotal, e.ExpectedTotal)
}

type OrderQuoteLine struct {
	VariantID    uuid.UUID `json:"variantId"`
	ProductID    uuid.UUID `json:"productId"`
	ProductName  string    `json:"productName"`
	MaterialName string    `json:"materialName"`
	ColorName    string    `json:"colorName"`
	Qty          int       `json:"qty"`
	UnitPrice    float64   `json:"unitPrice"`
	LineTotal    float64   `json:"lineTotal"`
}

type OrderQuote struct {
	Items            []OrderQuoteLine `json:"items"`
	Subtotal         float64          `json:"subtotal"`
	Discount         float64          `json:"discount"`
	Shipping         float64          `json:"shipping"`
	Total            float64          `json:"total"`
	DealTitle        string           `json:"dealTitle,omitempty"`
	CouponCode       string           `json:"couponCode,omitempty"`
	DiscountLabel    string           `json:"discountLabel,omitempty"`
	GiftProductID    *uuid.UUID       `json:"giftProductId,omitempty"`
	GiftProductName  string           `json:"giftProductName,omitempty"`
	GiftProductImage string           `json:"giftProductImage,omitempty"`
	GiftOfferTitle   string           `json:"giftOfferTitle,omitempty"`
}

func moneyEq(a, b float64) bool {
	diff := a - b
	if diff < 0 {
		diff = -diff
	}
	return diff < 0.005
}

type OrderResult struct {
	ID            uuid.UUID `json:"id"`
	Status        string    `json:"status"`
	PaymentMethod string    `json:"paymentMethod"`
	PaymentStatus string    `json:"paymentStatus"`
}

type OrderItemView struct {
	ID                    uuid.UUID       `json:"id"`
	ProductID             uuid.UUID       `json:"productId"`
	ProductName           string          `json:"productName"`
	ProductSlug           string          `json:"productSlug,omitempty"`
	VariantID             *uuid.UUID      `json:"variantId,omitempty"`
	MaterialName          string          `json:"materialName"`
	ColorName             string          `json:"colorName"`
	ColorHex              string          `json:"colorHex"`
	Qty                   int             `json:"qty"`
	UnitPrice             float64         `json:"unitPrice"`
	LineTotal             float64         `json:"lineTotal"`
	MeasurementSnapshot   json.RawMessage `json:"measurementSnapshot"`
	ImageURL              string          `json:"imageUrl"`
}

type OrderCustomer struct {
	ID        uuid.UUID       `json:"id"`
	Name      string          `json:"name"`
	Email     string          `json:"email"`
	Phone     string          `json:"phone"`
	AvatarURL string          `json:"avatarUrl"`
	Address   json.RawMessage `json:"address"`
}

type OrderView struct {
	ID                  uuid.UUID       `json:"id"`
	UserID              *uuid.UUID      `json:"userId,omitempty"`
	Status              string          `json:"status"`
	StatusLabel         string          `json:"statusLabel"`
	Currency            string          `json:"currency"`
	Email               string          `json:"email"`
	PaymentMethod       string          `json:"paymentMethod"`
	PaymentStatus       string          `json:"paymentStatus"`
	CouponCode          string          `json:"couponCode"`
	DealID              *uuid.UUID      `json:"dealId,omitempty"`
	DealTitle           string          `json:"dealTitle,omitempty"`
	AdminNote           string          `json:"adminNote"`
	Shipping            json.RawMessage `json:"shipping"`
	Totals              json.RawMessage `json:"totals"`
	MeasurementSnapshot json.RawMessage `json:"measurementSnapshot"`
	Items               []OrderItemView `json:"items"`
	ItemCount           int             `json:"itemCount"`
	Customer            *OrderCustomer  `json:"customer,omitempty"`
	CreatedAt           time.Time       `json:"createdAt"`
	UpdatedAt           time.Time       `json:"updatedAt"`
}

// OrderListFilter supports admin/customer listing without N+1 queries.
type OrderListFilter struct {
	Status        string // pending|accepted|out_for_delivery|delivered|rejected|refunded|all|new|to_accept
	PaymentMethod string // cod|online|""
	UserID        *uuid.UUID
	From          *time.Time
	To            *time.Time
	Limit         int
	Offset        int
	IncludeItems  bool
}

type OrderFacets struct {
	All            int `json:"all"`
	New            int `json:"new"`
	ToAccept       int `json:"toAccept"`
	Accepted       int `json:"accepted"`
	OutForDelivery int `json:"outForDelivery"`
	Delivered      int `json:"delivered"`
	Rejected       int `json:"rejected"`
	Refunded       int `json:"refunded"`
	COD            int `json:"cod"`
	Online         int `json:"online"`
}

func OrderStatusLabel(status string) string {
	switch status {
	case "pending":
		return "Order Received"
	case "accepted":
		return "Order Accepted"
	case "out_for_delivery":
		return "Out for Delivery"
	case "delivered":
		return "Delivered"
	case "rejected":
		return "Rejected"
	case "refunded":
		return "Refunded"
	case "cancelled":
		return "Cancelled"
	default:
		return status
	}
}

func normalizeOrderStatusFilter(status string) string {
	s := strings.ToLower(strings.TrimSpace(status))
	switch s {
	case "", "all":
		return "all"
	case "new", "to_accept", "to-accept", "pending":
		return "pending"
	case "accepted":
		return "accepted"
	case "out_for_delivery", "out-for-delivery", "shipping":
		return "out_for_delivery"
	case "delivered":
		return "delivered"
	case "rejected":
		return "rejected"
	case "refunded":
		return "refunded"
	default:
		return s
	}
}

type CustomerListItem struct {
	ID         uuid.UUID       `json:"id"`
	Name       string          `json:"name"`
	Email      string          `json:"email"`
	Phone      string          `json:"phone"`
	AvatarURL  string          `json:"avatarUrl"`
	Address    json.RawMessage `json:"address"`
	OrderCount int             `json:"orderCount"`
	CreatedAt  time.Time       `json:"createdAt"`
}

func (s *Store) QuoteOrder(ctx context.Context, userID *uuid.UUID, in OrderInput) (*OrderQuote, error) {
	if len(in.Items) == 0 {
		return nil, errors.New("cart is empty")
	}
	out := &OrderQuote{Items: make([]OrderQuoteLine, 0, len(in.Items))}
	productIDs := map[uuid.UUID]bool{}
	for _, item := range in.Items {
		if item.Qty < 1 {
			return nil, errors.New("quantity must be at least 1")
		}
		var v Variant
		var productName string
		err := s.DB.QueryRowContext(ctx, `
			SELECT v.id, v.product_id, v.sku, v.material_name, v.color_name, v.color_hex, v.size_label,
				v.price, v.compare_at_price, v.stock, v.max_per_order, v.is_active, p.name
			FROM product_variants v
			JOIN products p ON p.id=v.product_id
			WHERE v.id=$1`, item.VariantID).Scan(
			&v.ID, &v.ProductID, &v.SKU, &v.MaterialName, &v.ColorName, &v.ColorHex, &v.SizeLabel,
			&v.Price, &v.CompareAtPrice, &v.Stock, &v.MaxPerOrder, &v.IsActive, &productName)
		if err != nil {
			return nil, fmt.Errorf("variant not found: %s", item.VariantID)
		}
		if !v.IsActive {
			return nil, fmt.Errorf("%s / %s is unavailable", v.MaterialName, v.ColorName)
		}
		lineTotal := v.Price * float64(item.Qty)
		out.Subtotal += lineTotal
		productIDs[v.ProductID] = true
		out.Items = append(out.Items, OrderQuoteLine{
			VariantID: v.ID, ProductID: v.ProductID, ProductName: productName,
			MaterialName: v.MaterialName, ColorName: v.ColorName,
			Qty: item.Qty, UnitPrice: v.Price, LineTotal: lineTotal,
		})
	}

	if in.DealID != nil {
		var dtype string
		var dval float64
		var title string
		var scope string
		err := s.DB.QueryRowContext(ctx, `
			SELECT title, discount_type, discount_value, scope
			FROM deals
			WHERE id=$1 AND is_active=TRUE
				AND (starts_at IS NULL OR starts_at <= NOW())
				AND (ends_at IS NULL OR ends_at >= NOW())`, *in.DealID,
		).Scan(&title, &dtype, &dval, &scope)
		if err == nil {
			applies := scope == "platform" || scope == ""
			if scope == "products" {
				rows, _ := s.DB.QueryContext(ctx, `SELECT product_id FROM deal_products WHERE deal_id=$1`, *in.DealID)
				allowed := map[uuid.UUID]bool{}
				if rows != nil {
					for rows.Next() {
						var pid uuid.UUID
						_ = rows.Scan(&pid)
						allowed[pid] = true
					}
					rows.Close()
				}
				for pid := range productIDs {
					if allowed[pid] {
						applies = true
						break
					}
				}
			}
			if applies {
				if dtype == "fixed" {
					out.Discount = dval
				} else {
					out.Discount = out.Subtotal * (dval / 100)
				}
				if out.Discount > out.Subtotal {
					out.Discount = out.Subtotal
				}
				out.DealTitle = title
			}
		}
	}
	pids := make([]uuid.UUID, 0, len(productIDs))
	for id := range productIDs {
		pids = append(pids, id)
	}
	productTotals := map[uuid.UUID]float64{}
	for _, ln := range out.Items {
		productTotals[ln.ProductID] += ln.LineTotal
	}
	if code := strings.TrimSpace(in.CouponCode); code != "" {
		promoDisc, promoTitle, giftID, err := s.evalPromoCode(ctx, nil, code, out.Subtotal, pids, productTotals, userID)
		if err != nil {
			return nil, err
		}
		out.Discount += promoDisc
		if out.Discount > out.Subtotal {
			out.Discount = out.Subtotal
		}
		out.CouponCode = strings.ToUpper(code)
		if promoTitle != "" {
			out.DiscountLabel = promoTitle
			if out.DealTitle != "" {
				out.DealTitle = out.DealTitle + " · " + promoTitle
			} else {
				out.DealTitle = promoTitle
			}
		}
		if giftID != nil {
			out.GiftProductID = giftID
			out.GiftOfferTitle = promoTitle
			s.attachGiftQuoteMeta(ctx, out)
		}
	}
	if out.GiftProductID == nil {
		giftID, giftTitle, _ := s.evalGiftThreshold(ctx, nil, out.Subtotal, userID)
		if giftID != nil {
			out.GiftProductID = giftID
			out.GiftOfferTitle = giftTitle
			s.attachGiftQuoteMeta(ctx, out)
		}
	}
	if out.Subtotal-out.Discount < 99 {
		out.Shipping = 9.99
	}
	out.Total = out.Subtotal - out.Discount + out.Shipping
	if out.Total < 0 {
		out.Total = 0
	}
	return out, nil
}

func (s *Store) CreateOrder(ctx context.Context, userID *uuid.UUID, in OrderInput) (*OrderResult, error) {
	if userID == nil {
		return nil, errors.New("login required to place an order")
	}
	if len(in.Items) == 0 {
		return nil, errors.New("cart is empty")
	}
	if in.Shipping == nil {
		in.Shipping = json.RawMessage(`{}`)
	}
	if in.MeasurementSnapshot == nil {
		in.MeasurementSnapshot = json.RawMessage(`{}`)
	}
	method := strings.ToLower(strings.TrimSpace(in.PaymentMethod))
	if method != "online" {
		method = "cod"
	}
	if method == "cod" {
		codSettings, err := s.GetCodSettings(ctx)
		if err != nil {
			return nil, err
		}
		shipCountry, shipState := shippingCountryState(in.Shipping)
		if !CodAllowedForAddress(codSettings, shipCountry, shipState) {
			return nil, errors.New("cash on delivery is not available for this shipping address")
		}
	}
	payStatus := "unpaid"
	if method == "online" {
		payStatus = "paid" // mock gateway success
	}

	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()

	type line struct {
		Variant             Variant
		Qty                 int
		ExpectedUnitPrice   *float64
		ProductName         string
		MeasurementSnapshot json.RawMessage
	}
	lines := make([]line, 0, len(in.Items))
	var subtotal float64
	productIDs := map[uuid.UUID]bool{}
	mismatchLines := make([]PriceMismatchLine, 0)

	for _, item := range in.Items {
		if item.Qty < 1 {
			return nil, errors.New("quantity must be at least 1")
		}
		var v Variant
		err := tx.QueryRowContext(ctx, `
			SELECT id, product_id, sku, material_name, color_name, color_hex, size_label,
				price, compare_at_price, stock, max_per_order, is_active
			FROM product_variants WHERE id=$1 FOR UPDATE`, item.VariantID).Scan(
			&v.ID, &v.ProductID, &v.SKU, &v.MaterialName, &v.ColorName, &v.ColorHex, &v.SizeLabel,
			&v.Price, &v.CompareAtPrice, &v.Stock, &v.MaxPerOrder, &v.IsActive)
		if err != nil {
			return nil, fmt.Errorf("variant not found: %s", item.VariantID)
		}
		if !v.IsActive {
			return nil, fmt.Errorf("%s / %s is unavailable", v.MaterialName, v.ColorName)
		}
		if v.MaxPerOrder < 0 {
			v.MaxPerOrder = 0
		}
		if v.MaxPerOrder > 0 && item.Qty > v.MaxPerOrder {
			return nil, fmt.Errorf("%s / %s: max %d per order", v.MaterialName, v.ColorName, v.MaxPerOrder)
		}
		stock := 0
		if v.Stock != nil {
			stock = *v.Stock
		}
		if stock < item.Qty {
			if stock <= 0 {
				return nil, fmt.Errorf("%s / %s is out of stock", v.MaterialName, v.ColorName)
			}
			return nil, fmt.Errorf("%s / %s: only %d left", v.MaterialName, v.ColorName, stock)
		}
		var productName string
		_ = tx.QueryRowContext(ctx, `SELECT name FROM products WHERE id=$1`, v.ProductID).Scan(&productName)
		if item.ExpectedUnitPrice != nil && !moneyEq(*item.ExpectedUnitPrice, v.Price) {
			mismatchLines = append(mismatchLines, PriceMismatchLine{
				VariantID:         v.ID,
				ProductName:       productName,
				MaterialName:      v.MaterialName,
				ColorName:         v.ColorName,
				Qty:               item.Qty,
				ExpectedUnitPrice: *item.ExpectedUnitPrice,
				CurrentUnitPrice:  v.Price,
			})
		}
		meas := item.MeasurementSnapshot
		if len(meas) == 0 {
			meas = in.MeasurementSnapshot
		}
		lines = append(lines, line{
			Variant: v, Qty: item.Qty,
			ExpectedUnitPrice:   item.ExpectedUnitPrice,
			ProductName:         productName,
			MeasurementSnapshot: meas,
		})
		subtotal += v.Price * float64(item.Qty)
		productIDs[v.ProductID] = true
	}

	discount := 0.0
	discountLabel := ""
	var dealID any
	dealTitle := ""
	if in.DealID != nil {
		var dtype string
		var dval float64
		var title string
		var scope string
		err := tx.QueryRowContext(ctx, `
			SELECT title, discount_type, discount_value, scope
			FROM deals
			WHERE id=$1 AND is_active=TRUE
				AND (starts_at IS NULL OR starts_at <= NOW())
				AND (ends_at IS NULL OR ends_at >= NOW())`, *in.DealID,
		).Scan(&title, &dtype, &dval, &scope)
		if err == nil {
			applies := scope == "platform" || scope == ""
			if scope == "products" {
				rows, _ := tx.QueryContext(ctx, `SELECT product_id FROM deal_products WHERE deal_id=$1`, *in.DealID)
				allowed := map[uuid.UUID]bool{}
				if rows != nil {
					for rows.Next() {
						var pid uuid.UUID
						_ = rows.Scan(&pid)
						allowed[pid] = true
					}
					rows.Close()
				}
				for pid := range productIDs {
					if allowed[pid] {
						applies = true
						break
					}
				}
			}
			if scope == "category" {
				rows, _ := tx.QueryContext(ctx, `
					SELECT pc.product_id FROM deal_categories dc
					JOIN product_categories pc ON pc.category_id=dc.category_id
					WHERE dc.deal_id=$1`, *in.DealID)
				allowed := map[uuid.UUID]bool{}
				if rows != nil {
					for rows.Next() {
						var pid uuid.UUID
						_ = rows.Scan(&pid)
						allowed[pid] = true
					}
					rows.Close()
				}
				for pid := range productIDs {
					if allowed[pid] {
						applies = true
						break
					}
				}
			}
			if applies {
				if dtype == "fixed" {
					discount = dval
					discountLabel = fmt.Sprintf("$%.0f OFF · %s", dval, title)
				} else {
					discount = subtotal * (dval / 100)
					discountLabel = fmt.Sprintf("%.0f%% OFF · %s", dval, title)
				}
				if discount > subtotal {
					discount = subtotal
				}
				dealID = *in.DealID
				dealTitle = title
			}
		}
	}

	pids := make([]uuid.UUID, 0, len(productIDs))
	productTotals := map[uuid.UUID]float64{}
	for _, ln := range lines {
		pids = append(pids, ln.Variant.ProductID)
		productTotals[ln.Variant.ProductID] += ln.Variant.Price * float64(ln.Qty)
	}
	var promoID *uuid.UUID
	var giftPromoID *uuid.UUID
	var giftProductID *uuid.UUID
	var giftOfferTitle string
	if code := strings.TrimSpace(in.CouponCode); code != "" {
		promoDisc, promoTitle, giftID, err := s.evalPromoCode(ctx, tx, code, subtotal, pids, productTotals, userID)
		if err != nil {
			return nil, err
		}
		discount += promoDisc
		if discount > subtotal {
			discount = subtotal
		}
		if promoTitle != "" {
			if discountLabel != "" {
				discountLabel = discountLabel + " · " + promoTitle
			} else {
				discountLabel = promoTitle
			}
		}
		giftProductID = giftID
		giftOfferTitle = promoTitle
		var id uuid.UUID
		_ = tx.QueryRowContext(ctx, `SELECT id FROM promotions WHERE LOWER(code)=LOWER($1)`, code).Scan(&id)
		if id != uuid.Nil {
			promoID = &id
			if giftID != nil {
				giftPromoID = &id
			}
		}
	}
	if giftProductID == nil {
		giftID, giftTitle, gPromo := s.evalGiftThreshold(ctx, tx, subtotal, userID)
		if giftID != nil {
			giftProductID = giftID
			giftOfferTitle = giftTitle
			giftPromoID = gPromo
			if promoID == nil {
				promoID = gPromo
			}
		}
	}

	shipping := 0.0
	if subtotal-discount < 99 {
		shipping = 9.99
	}
	total := subtotal - discount + shipping
	if total < 0 {
		total = 0
	}

	// Rebuild what the client thought they were paying (from cart unit prices).
	clientSubtotal := 0.0
	clientHadPrices := false
	for _, ln := range lines {
		if ln.ExpectedUnitPrice != nil {
			clientHadPrices = true
			clientSubtotal += *ln.ExpectedUnitPrice * float64(ln.Qty)
		} else {
			clientSubtotal += ln.Variant.Price * float64(ln.Qty)
		}
	}
	if in.ExpectedSubtotal != nil {
		clientHadPrices = true
		clientSubtotal = *in.ExpectedSubtotal
	}
	clientShip := 0.0
	if clientSubtotal-discount < 99 {
		clientShip = 9.99
	}
	clientTotal := clientSubtotal - discount + clientShip
	if in.ExpectedPaidAmount != nil {
		clientHadPrices = true
		clientTotal = *in.ExpectedPaidAmount
	} else if in.ExpectedTotal != nil {
		clientHadPrices = true
		clientTotal = *in.ExpectedTotal
	}

	if clientHadPrices && (len(mismatchLines) > 0 || !moneyEq(clientSubtotal, subtotal) || !moneyEq(clientTotal, total)) {
		msg := fmt.Sprintf(
			"Prices changed. You must pay $%.2f — your cart shows $%.2f.",
			total, clientTotal,
		)
		return nil, &PriceMismatchError{
			Message:          msg,
			ExpectedSubtotal: clientSubtotal,
			CurrentSubtotal:  subtotal,
			ExpectedTotal:    clientTotal,
			CurrentTotal:     total,
			Shipping:         shipping,
			Discount:         discount,
			Lines:            mismatchLines,
		}
	}

	totals, _ := json.Marshal(map[string]any{
		"subtotal":       subtotal,
		"discount":       discount,
		"discountLabel":  discountLabel,
		"shipping":       shipping,
		"total":          total,
		"dealTitle":      dealTitle,
		"couponCode":     strings.TrimSpace(in.CouponCode),
		"giftProductId":  giftProductID,
		"giftOfferTitle": giftOfferTitle,
		"paidAmount":     total,
	})

	orderID := uuid.New()
	_, err = tx.ExecContext(ctx, `
		INSERT INTO orders (
			id, user_id, status, currency, email, shipping_json, totals_json, measurement_snapshot_json,
			payment_method, payment_status, deal_id, coupon_code, updated_at
		) VALUES ($1,$2,'pending','USD',$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
		orderID, *userID, in.Email, []byte(in.Shipping), totals, []byte(in.MeasurementSnapshot),
		method, payStatus, dealID, strings.TrimSpace(in.CouponCode))
	if err != nil {
		return nil, err
	}

	if promoID != nil {
		_, _ = tx.ExecContext(ctx, `
			INSERT INTO promotion_redemptions (id, promotion_id, user_id, order_id, code, discount_amount)
			VALUES ($1,$2,$3,$4,$5,$6)`,
			uuid.New(), *promoID, *userID, orderID, strings.ToUpper(strings.TrimSpace(in.CouponCode)), discount)
		_, _ = tx.ExecContext(ctx, `
			UPDATE promotions SET redemption_count=redemption_count+1, updated_at=NOW() WHERE id=$1`, *promoID)
	}
	if giftPromoID != nil && (promoID == nil || *giftPromoID != *promoID) {
		_, _ = tx.ExecContext(ctx, `
			INSERT INTO promotion_redemptions (id, promotion_id, user_id, order_id, code, discount_amount)
			VALUES ($1,$2,$3,$4,$5,0)`,
			uuid.New(), *giftPromoID, *userID, orderID, "")
		_, _ = tx.ExecContext(ctx, `
			UPDATE promotions SET redemption_count=redemption_count+1, updated_at=NOW() WHERE id=$1`, *giftPromoID)
	}

	for _, ln := range lines {
		meas := ln.MeasurementSnapshot
		if len(meas) == 0 {
			meas = json.RawMessage(`{}`)
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO order_items (id, order_id, product_id, variant_id, qty, unit_price, measurement_snapshot_json)
			VALUES ($1,$2,$3,$4,$5,$6,$7)`,
			uuid.New(), orderID, ln.Variant.ProductID, ln.Variant.ID, ln.Qty, ln.Variant.Price, []byte(meas))
		if err != nil {
			return nil, err
		}
		res, err := tx.ExecContext(ctx, `
			UPDATE product_variants
			SET stock = stock - $2
			WHERE id=$1 AND stock IS NOT NULL AND stock >= $2`,
			ln.Variant.ID, ln.Qty)
		if err != nil {
			return nil, err
		}
		n, _ := res.RowsAffected()
		if n != 1 {
			return nil, fmt.Errorf("%s / %s: stock changed, try again", ln.Variant.MaterialName, ln.Variant.ColorName)
		}
	}

	// Free gift lines are $0 and do not deplete stock (offer-only SKUs).
	if giftProductID != nil {
		var giftVariantID *uuid.UUID
		var vid uuid.UUID
		err = tx.QueryRowContext(ctx, `
			SELECT id FROM product_variants
			WHERE product_id=$1 AND is_active=TRUE
			ORDER BY price ASC
			LIMIT 1`, *giftProductID).Scan(&vid)
		if err == nil {
			giftVariantID = &vid
		}
		_, err = tx.ExecContext(ctx, `
			INSERT INTO order_items (id, order_id, product_id, variant_id, qty, unit_price, measurement_snapshot_json)
			VALUES ($1,$2,$3,$4,1,0,$5)`,
			uuid.New(), orderID, *giftProductID, giftVariantID, []byte(`{"offerGift":true}`))
		if err != nil {
			return nil, err
		}
	}

	// Persist shipping onto user profile for next time
	_, _ = tx.ExecContext(ctx, `
		UPDATE users SET
			phone = CASE WHEN $2 <> '' THEN $2 ELSE phone END,
			address_json = CASE WHEN $3::text <> '{}' THEN $3::jsonb ELSE address_json END
		WHERE id=$1`,
		*userID,
		shippingPhone(in.Shipping),
		string(in.Shipping),
	)

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return &OrderResult{
		ID:            orderID,
		Status:        "pending",
		PaymentMethod: method,
		PaymentStatus: payStatus,
	}, nil
}

func shippingPhone(raw json.RawMessage) string {
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		return ""
	}
	if v, ok := m["phone"].(string); ok {
		return v
	}
	return ""
}

func (s *Store) ListOrders(ctx context.Context, status string, limit, offset int) ([]OrderView, int, error) {
	list, total, _, err := s.ListOrdersFiltered(ctx, OrderListFilter{
		Status: status, Limit: limit, Offset: offset, IncludeItems: false,
	})
	return list, total, err
}

func (s *Store) ListOrdersFiltered(ctx context.Context, f OrderListFilter) ([]OrderView, int, OrderFacets, error) {
	if f.Limit <= 0 || f.Limit > 100 {
		f.Limit = 20
	}
	if f.Offset < 0 {
		f.Offset = 0
	}

	where, args := buildOrderWhere(f)

	var facets OrderFacets
	facetArgs := make([]any, 0, 3)
	facetWhere := "1=1"
	n := 0
	if f.UserID != nil {
		n++
		facetArgs = append(facetArgs, *f.UserID)
		facetWhere += fmt.Sprintf(" AND user_id=$%d", n)
	}
	if f.From != nil {
		n++
		facetArgs = append(facetArgs, *f.From)
		facetWhere += fmt.Sprintf(" AND created_at >= $%d", n)
	}
	if f.To != nil {
		n++
		facetArgs = append(facetArgs, *f.To)
		facetWhere += fmt.Sprintf(" AND created_at < $%d", n)
	}
	if err := s.DB.QueryRowContext(ctx, `
		SELECT
			COUNT(*)::int,
			COUNT(*) FILTER (WHERE status='pending')::int,
			COUNT(*) FILTER (WHERE status='pending')::int,
			COUNT(*) FILTER (WHERE status='accepted')::int,
			COUNT(*) FILTER (WHERE status='out_for_delivery')::int,
			COUNT(*) FILTER (WHERE status='delivered')::int,
			COUNT(*) FILTER (WHERE status IN ('rejected','cancelled'))::int,
			COUNT(*) FILTER (WHERE status='refunded')::int,
			COUNT(*) FILTER (WHERE payment_method='cod')::int,
			COUNT(*) FILTER (WHERE payment_method='online')::int
		FROM orders WHERE `+facetWhere, facetArgs...).Scan(
		&facets.All, &facets.New, &facets.ToAccept, &facets.Accepted,
		&facets.OutForDelivery, &facets.Delivered, &facets.Rejected, &facets.Refunded,
		&facets.COD, &facets.Online,
	); err != nil {
		return nil, 0, facets, err
	}

	var total int
	countQ := `SELECT COUNT(*) FROM orders o WHERE ` + where
	if err := s.DB.QueryRowContext(ctx, countQ, args...).Scan(&total); err != nil {
		return nil, 0, facets, err
	}

	args = append(args, f.Limit, f.Offset)
	q := fmt.Sprintf(`
		SELECT o.id, o.user_id, o.status, o.currency, o.email,
			COALESCE(o.payment_method,'cod'), COALESCE(o.payment_status,'unpaid'),
			COALESCE(o.coupon_code,''), o.deal_id, COALESCE(o.admin_note,''),
			o.shipping_json, o.totals_json, o.measurement_snapshot_json,
			o.created_at, COALESCE(o.updated_at, o.created_at),
			COALESCE(d.title,''),
			COALESCE(u.name,''), COALESCE(u.email,''), COALESCE(u.phone,''),
			COALESCE(u.avatar_url,''), COALESCE(u.address_json,'{}'::jsonb),
			COALESCE((SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id=o.id), 0)
		FROM orders o
		LEFT JOIN deals d ON d.id=o.deal_id
		LEFT JOIN users u ON u.id=o.user_id
		WHERE %s
		ORDER BY o.created_at DESC
		LIMIT $%d OFFSET $%d`, where, len(args)-1, len(args))

	rows, err := s.DB.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, 0, facets, err
	}
	defer rows.Close()

	out := make([]OrderView, 0, f.Limit)
	ids := make([]uuid.UUID, 0, f.Limit)
	for rows.Next() {
		var o OrderView
		var userID, dealID uuid.NullUUID
		var cName, cEmail, cPhone, cAvatar string
		var cAddress json.RawMessage
		if err := rows.Scan(
			&o.ID, &userID, &o.Status, &o.Currency, &o.Email,
			&o.PaymentMethod, &o.PaymentStatus, &o.CouponCode, &dealID, &o.AdminNote,
			&o.Shipping, &o.Totals, &o.MeasurementSnapshot,
			&o.CreatedAt, &o.UpdatedAt, &o.DealTitle,
			&cName, &cEmail, &cPhone, &cAvatar, &cAddress, &o.ItemCount,
		); err != nil {
			return nil, 0, facets, err
		}
		o.StatusLabel = OrderStatusLabel(o.Status)
		o.Items = []OrderItemView{}
		if userID.Valid {
			id := userID.UUID
			o.UserID = &id
			o.Customer = &OrderCustomer{
				ID: id, Name: cName, Email: cEmail, Phone: cPhone,
				AvatarURL: cAvatar, Address: cAddress,
			}
		}
		if dealID.Valid {
			id := dealID.UUID
			o.DealID = &id
		}
		out = append(out, o)
		ids = append(ids, o.ID)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, facets, err
	}

	if f.IncludeItems && len(ids) > 0 {
		byOrder, err := s.orderItemsBatch(ctx, ids)
		if err != nil {
			return nil, 0, facets, err
		}
		for i := range out {
			items := byOrder[out[i].ID]
			if items == nil {
				items = []OrderItemView{}
			}
			out[i].Items = items
			out[i].ItemCount = len(items)
		}
	}

	return out, total, facets, nil
}

func buildOrderWhere(f OrderListFilter) (string, []any) {
	args := []any{}
	where := "1=1"
	status := normalizeOrderStatusFilter(f.Status)
	if status != "all" {
		if status == "rejected" {
			// Query-cancelled and customer-cancelled sit with rejected in admin.
			where += " AND o.status IN ('rejected','cancelled')"
		} else {
			args = append(args, status)
			where += fmt.Sprintf(" AND o.status=$%d", len(args))
		}
	}
	pm := strings.ToLower(strings.TrimSpace(f.PaymentMethod))
	if pm == "cod" || pm == "online" {
		args = append(args, pm)
		where += fmt.Sprintf(" AND o.payment_method=$%d", len(args))
	}
	if f.UserID != nil {
		args = append(args, *f.UserID)
		where += fmt.Sprintf(" AND o.user_id=$%d", len(args))
	}
	if f.From != nil {
		args = append(args, *f.From)
		where += fmt.Sprintf(" AND o.created_at >= $%d", len(args))
	}
	if f.To != nil {
		args = append(args, *f.To)
		where += fmt.Sprintf(" AND o.created_at < $%d", len(args))
	}
	return where, args
}

func (s *Store) GetOrder(ctx context.Context, id uuid.UUID) (*OrderView, error) {
	var o OrderView
	var userID, dealID uuid.NullUUID
	var cName, cEmail, cPhone, cAvatar string
	var cAddress json.RawMessage
	err := s.DB.QueryRowContext(ctx, `
		SELECT o.id, o.user_id, o.status, o.currency, o.email,
			COALESCE(o.payment_method,'cod'), COALESCE(o.payment_status,'unpaid'),
			COALESCE(o.coupon_code,''), o.deal_id, COALESCE(o.admin_note,''),
			o.shipping_json, o.totals_json, o.measurement_snapshot_json,
			o.created_at, COALESCE(o.updated_at, o.created_at),
			COALESCE(d.title,''),
			COALESCE(u.name,''), COALESCE(u.email,''), COALESCE(u.phone,''),
			COALESCE(u.avatar_url,''), COALESCE(u.address_json,'{}'::jsonb)
		FROM orders o
		LEFT JOIN deals d ON d.id=o.deal_id
		LEFT JOIN users u ON u.id=o.user_id
		WHERE o.id=$1`, id,
	).Scan(
		&o.ID, &userID, &o.Status, &o.Currency, &o.Email,
		&o.PaymentMethod, &o.PaymentStatus, &o.CouponCode, &dealID, &o.AdminNote,
		&o.Shipping, &o.Totals, &o.MeasurementSnapshot,
		&o.CreatedAt, &o.UpdatedAt, &o.DealTitle,
		&cName, &cEmail, &cPhone, &cAvatar, &cAddress,
	)
	if err != nil {
		return nil, err
	}
	o.StatusLabel = OrderStatusLabel(o.Status)
	if userID.Valid {
		uid := userID.UUID
		o.UserID = &uid
		o.Customer = &OrderCustomer{
			ID: uid, Name: cName, Email: cEmail, Phone: cPhone,
			AvatarURL: cAvatar, Address: cAddress,
		}
	}
	if dealID.Valid {
		did := dealID.UUID
		o.DealID = &did
	}
	items, err := s.orderItemsBatch(ctx, []uuid.UUID{o.ID})
	if err != nil {
		return nil, err
	}
	o.Items = items[o.ID]
	if o.Items == nil {
		o.Items = []OrderItemView{}
	}
	o.ItemCount = len(o.Items)
	return &o, nil
}

func (s *Store) orderItemsBatch(ctx context.Context, orderIDs []uuid.UUID) (map[uuid.UUID][]OrderItemView, error) {
	out := make(map[uuid.UUID][]OrderItemView, len(orderIDs))
	if len(orderIDs) == 0 {
		return out, nil
	}
	args := make([]any, len(orderIDs))
	ph := make([]string, len(orderIDs))
	for i, id := range orderIDs {
		args[i] = id
		ph[i] = fmt.Sprintf("$%d", i+1)
	}
	rows, err := s.DB.QueryContext(ctx, fmt.Sprintf(`
		SELECT oi.order_id, oi.id, oi.product_id, p.name, COALESCE(p.slug,''), oi.variant_id,
			COALESCE(v.material_name,''), COALESCE(v.color_name,''), COALESCE(v.color_hex,''),
			oi.qty, oi.unit_price, oi.measurement_snapshot_json,
			COALESCE(img.url,'')
		FROM order_items oi
		JOIN products p ON p.id=oi.product_id
		LEFT JOIN product_variants v ON v.id=oi.variant_id
		LEFT JOIN LATERAL (
			SELECT pi.url FROM product_images pi
			WHERE pi.product_id=p.id
			ORDER BY pi.sort_order ASC
			LIMIT 1
		) img ON TRUE
		WHERE oi.order_id IN (%s)
		ORDER BY oi.order_id, oi.id`, strings.Join(ph, ",")), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var orderID uuid.UUID
		var it OrderItemView
		var vid uuid.NullUUID
		if err := rows.Scan(
			&orderID, &it.ID, &it.ProductID, &it.ProductName, &it.ProductSlug, &vid,
			&it.MaterialName, &it.ColorName, &it.ColorHex,
			&it.Qty, &it.UnitPrice, &it.MeasurementSnapshot, &it.ImageURL,
		); err != nil {
			return nil, err
		}
		if vid.Valid {
			id := vid.UUID
			it.VariantID = &id
		}
		it.LineTotal = it.UnitPrice * float64(it.Qty)
		out[orderID] = append(out[orderID], it)
	}
	return out, rows.Err()
}

func (s *Store) UpdateOrderAction(ctx context.Context, id uuid.UUID, action, note string) (*OrderView, error) {
	o, err := s.GetOrder(ctx, id)
	if err != nil {
		return nil, err
	}

	action = strings.ToLower(strings.TrimSpace(action))
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()

	switch action {
	case "accept":
		if o.Status != "pending" {
			return nil, fmt.Errorf("only pending orders can be accepted (current: %s)", o.Status)
		}
		_, err = tx.ExecContext(ctx, `
			UPDATE orders SET status='accepted', admin_note=$2, updated_at=NOW() WHERE id=$1 AND status='pending'`, id, note)
	case "ship", "out_for_delivery":
		if o.Status != "accepted" {
			return nil, fmt.Errorf("only accepted orders can go out for delivery (current: %s)", o.Status)
		}
		_, err = tx.ExecContext(ctx, `
			UPDATE orders SET status='out_for_delivery', admin_note=$2, updated_at=NOW()
			WHERE id=$1 AND status='accepted'`, id, note)
	case "deliver", "delivered":
		if o.Status != "out_for_delivery" {
			return nil, fmt.Errorf("only out-for-delivery orders can be marked delivered (current: %s)", o.Status)
		}
		_, err = tx.ExecContext(ctx, `
			UPDATE orders SET status='delivered', admin_note=$2, updated_at=NOW()
			WHERE id=$1 AND status='out_for_delivery'`, id, note)
	case "reject":
		if o.Status != "pending" {
			return nil, fmt.Errorf("only pending orders can be rejected (current: %s)", o.Status)
		}
		if o.PaymentMethod == "online" && o.PaymentStatus == "paid" {
			_, err = tx.ExecContext(ctx, `
				UPDATE orders SET status='refunded', payment_status='refunded', admin_note=$2, updated_at=NOW()
				WHERE id=$1 AND status='pending'`, id, note)
		} else {
			_, err = tx.ExecContext(ctx, `
				UPDATE orders SET status='rejected', admin_note=$2, updated_at=NOW()
				WHERE id=$1 AND status='pending'`, id, note)
		}
		if err == nil {
			err = restoreOrderStock(tx, ctx, id)
		}
	case "refund":
		if o.PaymentMethod != "online" || o.PaymentStatus != "paid" {
			return nil, errors.New("only paid online orders can be refunded")
		}
		if o.Status != "pending" && o.Status != "accepted" {
			return nil, fmt.Errorf("cannot refund order in status %s", o.Status)
		}
		_, err = tx.ExecContext(ctx, `
			UPDATE orders SET status='refunded', payment_status='refunded', admin_note=$2, updated_at=NOW()
			WHERE id=$1`, id, note)
		if err == nil {
			err = restoreOrderStock(tx, ctx, id)
		}
	default:
		return nil, errors.New("unknown action")
	}
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	updated, err := s.GetOrder(ctx, id)
	if err != nil {
		return nil, err
	}
	if updated.UserID != nil {
		title, body := orderStatusNotifyCopy(action, updated.Status)
		if title != "" {
			oid := updated.ID
			_ = s.NotifyUser(ctx, *updated.UserID, title, body, &oid, nil)
		}
	}
	return updated, nil
}

func orderStatusNotifyCopy(action, status string) (string, string) {
	switch strings.ToLower(strings.TrimSpace(action)) {
	case "accept":
		return "Order accepted", "Your order was accepted and is being prepared."
	case "ship", "out_for_delivery":
		return "Out for delivery", "Your order is on the way."
	case "deliver", "delivered":
		return "Order delivered", "Your order was marked delivered. Enjoy the fit."
	case "reject":
		if status == "refunded" {
			return "Order refunded", "Your order was rejected and refunded."
		}
		return "Order rejected", "Your order was rejected. Stock was restored."
	case "refund":
		return "Order refunded", "Your paid order was refunded."
	case "cancel_as_requested":
		return "Order cancelled", "Your order is cancelled from the admin side as you requested."
	default:
		return "", ""
	}
}

type CancelFromQueryInput struct {
	Refund       bool     `json:"refund"`
	RefundAmount *float64 `json:"refundAmount"`
	Note         string   `json:"note"`
}

type MeasFieldChange struct {
	Section string `json:"section"` // top | bottom
	Key     string `json:"key"`
	Label   string `json:"label"`
	From    string `json:"from"`
	To      string `json:"to"`
}

type MeasAdminEdit struct {
	At        string            `json:"at"`
	By        string            `json:"by"`
	Product   string            `json:"product,omitempty"`
	Changes   []MeasFieldChange `json:"changes"`
	Note      string            `json:"note,omitempty"`
}

type UpdateItemMeasurementsInput struct {
	Top    map[string]string `json:"top"`
	Bottom map[string]string `json:"bottom"`
	Notes  *string           `json:"notes"`
}

type UpdateOrderShippingInput struct {
	FullName string `json:"fullName"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Address  string `json:"address"`
	City     string `json:"city"`
	State    string `json:"state"`
	Zip      string `json:"zip"`
	Country  string `json:"country"`
}

type AddressAdminEdit struct {
	At   string            `json:"at"`
	By   string            `json:"by"`
	From map[string]string `json:"from"`
	To   map[string]string `json:"to"`
}

func orderTotalFromJSON(raw json.RawMessage) float64 {
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		return 0
	}
	switch v := m["total"].(type) {
	case float64:
		return v
	case json.Number:
		f, _ := v.Float64()
		return f
	default:
		return 0
	}
}

func mergeOrderTotals(raw json.RawMessage, extra map[string]any) (json.RawMessage, error) {
	m := map[string]any{}
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &m)
	}
	for k, v := range extra {
		m[k] = v
	}
	return json.Marshal(m)
}

func canCancelFromQuery(status string) bool {
	switch status {
	case "pending", "accepted":
		return true
	default:
		return false
	}
}

func canEditOrderMeasurements(status string) bool {
	switch status {
	case "pending", "accepted":
		return true
	default:
		return false
	}
}

func canEditOrderShipping(status string) bool {
	switch status {
	case "pending", "accepted", "out_for_delivery":
		return true
	default:
		return false
	}
}

func shippingFieldMap(raw json.RawMessage) map[string]string {
	m := map[string]string{}
	if len(raw) == 0 {
		return m
	}
	var anyMap map[string]any
	if err := json.Unmarshal(raw, &anyMap); err != nil {
		return m
	}
	for _, k := range []string{"fullName", "email", "phone", "address", "city", "state", "zip", "country"} {
		if v, ok := anyMap[k]; ok && v != nil {
			m[k] = strings.TrimSpace(fmt.Sprint(v))
			if m[k] == "<nil>" {
				m[k] = ""
			}
		}
	}
	return m
}

func formatShippingLocation(m map[string]string) string {
	parts := []string{}
	for _, k := range []string{"address", "city", "state", "zip", "country"} {
		if v := strings.TrimSpace(m[k]); v != "" {
			parts = append(parts, v)
		}
	}
	return strings.Join(parts, ", ")
}

func measLabel(key string) string {
	pretty := strings.ReplaceAll(key, "_", " ")
	var b strings.Builder
	for i, r := range pretty {
		if i > 0 && r >= 'A' && r <= 'Z' {
			b.WriteByte(' ')
		}
		if i == 0 || pretty[i-1] == ' ' {
			if r >= 'a' && r <= 'z' {
				b.WriteRune(r - 32)
				continue
			}
		}
		b.WriteRune(r)
	}
	out := strings.TrimSpace(b.String())
	if out == "" {
		return key
	}
	return out
}

func mapStringValues(v any) map[string]string {
	out := map[string]string{}
	m, ok := v.(map[string]any)
	if !ok {
		return out
	}
	for k, raw := range m {
		out[k] = strings.TrimSpace(fmt.Sprint(raw))
		if out[k] == "<nil>" {
			out[k] = ""
		}
	}
	return out
}

func diffMeasSection(section string, before, after map[string]string) []MeasFieldChange {
	keys := map[string]bool{}
	for k := range before {
		keys[k] = true
	}
	for k := range after {
		keys[k] = true
	}
	changes := make([]MeasFieldChange, 0)
	for k := range keys {
		from := strings.TrimSpace(before[k])
		to := strings.TrimSpace(after[k])
		if from == to {
			continue
		}
		changes = append(changes, MeasFieldChange{
			Section: section,
			Key:     k,
			Label:   measLabel(k),
			From:    from,
			To:      to,
		})
	}
	return changes
}

// CancelOrderFromQuery lets admin cancel from the Queries panel.
// COD / no-refund → rejected. Online paid + refund → refunded with optional fee.
// Customer notification always uses the "as you requested" copy.
func (s *Store) CancelOrderFromQuery(ctx context.Context, id uuid.UUID, in CancelFromQueryInput) (*OrderView, error) {
	o, err := s.GetOrder(ctx, id)
	if err != nil {
		return nil, err
	}
	if !canCancelFromQuery(o.Status) {
		return nil, fmt.Errorf("cannot cancel order in status %s (only pending or accepted)", o.Status)
	}

	total := orderTotalFromJSON(o.Totals)
	note := strings.TrimSpace(in.Note)
	if note == "" {
		note = "Cancelled from query as requested by customer"
	} else {
		note = "Cancelled from query as requested by customer — " + note
	}

	doRefund := in.Refund && o.PaymentMethod == "online" && o.PaymentStatus == "paid"
	var refundAmount float64
	var fee float64
	if doRefund {
		if in.RefundAmount == nil {
			refundAmount = total
		} else {
			refundAmount = *in.RefundAmount
		}
		if refundAmount < 0 {
			return nil, errors.New("refund amount cannot be negative")
		}
		if refundAmount > total {
			return nil, fmt.Errorf("refund amount cannot exceed order total (%.2f)", total)
		}
		fee = total - refundAmount
		note = fmt.Sprintf("%s | refund=$%.2f fee=$%.2f", note, refundAmount, fee)
	}

	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()

	newTotals := o.Totals
	if doRefund {
		newTotals, err = mergeOrderTotals(o.Totals, map[string]any{
			"refundAmount":     refundAmount,
			"cancellationFee":  fee,
			"cancelledFromQuery": true,
		})
		if err != nil {
			return nil, err
		}
		_, err = tx.ExecContext(ctx, `
			UPDATE orders SET status='refunded', payment_status='refunded',
				admin_note=$2, totals_json=$3, updated_at=NOW()
			WHERE id=$1 AND status IN ('pending','accepted')`, id, note, newTotals)
	} else {
		newTotals, err = mergeOrderTotals(o.Totals, map[string]any{
			"cancelledFromQuery": true,
			"cancellationFee":    0,
			"refundAmount":       0,
		})
		if err != nil {
			return nil, err
		}
		_, err = tx.ExecContext(ctx, `
			UPDATE orders SET status='rejected',
				admin_note=$2, totals_json=$3, updated_at=NOW()
			WHERE id=$1 AND status IN ('pending','accepted')`, id, note, newTotals)
	}
	if err != nil {
		return nil, err
	}
	if err = restoreOrderStock(tx, ctx, id); err != nil {
		return nil, err
	}
	if err = tx.Commit(); err != nil {
		return nil, err
	}

	updated, err := s.GetOrder(ctx, id)
	if err != nil {
		return nil, err
	}
	if updated.UserID != nil {
		oid := updated.ID
		title := "Order cancelled"
		body := "Your order is cancelled from the admin side as you requested."
		if doRefund {
			if fee > 0 {
				body = fmt.Sprintf(
					"Your order is cancelled from the admin side as you requested. Refund $%.2f (cancellation charge $%.2f).",
					refundAmount, fee,
				)
			} else {
				body = fmt.Sprintf(
					"Your order is cancelled from the admin side as you requested. Full refund $%.2f.",
					refundAmount,
				)
			}
		}
		_ = s.NotifyUser(ctx, *updated.UserID, title, body, &oid, nil)
	}
	return updated, nil
}

// UpdateOrderItemMeasurements lets admin edit a line’s fit before tailoring starts.
func (s *Store) UpdateOrderItemMeasurements(ctx context.Context, orderID, itemID uuid.UUID, in UpdateItemMeasurementsInput) (*OrderView, error) {
	o, err := s.GetOrder(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if !canEditOrderMeasurements(o.Status) {
		return nil, fmt.Errorf("measurements can’t be edited after the order is tailored / shipped (status: %s)", o.Status)
	}

	var item *OrderItemView
	for i := range o.Items {
		if o.Items[i].ID == itemID {
			item = &o.Items[i]
			break
		}
	}
	if item == nil {
		return nil, errors.New("order item not found")
	}

	snap := map[string]any{}
	if len(item.MeasurementSnapshot) > 0 {
		_ = json.Unmarshal(item.MeasurementSnapshot, &snap)
	}
	beforeTop := mapStringValues(snap["top"])
	beforeBottom := mapStringValues(snap["bottom"])

	afterTop := beforeTop
	if in.Top != nil {
		afterTop = map[string]string{}
		for k, v := range in.Top {
			afterTop[k] = strings.TrimSpace(v)
		}
	}
	afterBottom := beforeBottom
	if in.Bottom != nil {
		afterBottom = map[string]string{}
		for k, v := range in.Bottom {
			afterBottom[k] = strings.TrimSpace(v)
		}
	}

	changes := append(
		diffMeasSection("top", beforeTop, afterTop),
		diffMeasSection("bottom", beforeBottom, afterBottom)...,
	)
	if in.Notes != nil {
		prevNotes := strings.TrimSpace(fmt.Sprint(snap["notes"]))
		if prevNotes == "<nil>" {
			prevNotes = ""
		}
		nextNotes := strings.TrimSpace(*in.Notes)
		if prevNotes != nextNotes {
			changes = append(changes, MeasFieldChange{
				Section: "notes",
				Key:     "notes",
				Label:   "Notes",
				From:    prevNotes,
				To:      nextNotes,
			})
			snap["notes"] = nextNotes
		}
	}
	if len(changes) == 0 {
		return nil, errors.New("no measurement changes")
	}

	topObj := map[string]any{}
	for k, v := range afterTop {
		topObj[k] = v
	}
	bottomObj := map[string]any{}
	for k, v := range afterBottom {
		bottomObj[k] = v
	}
	snap["top"] = topObj
	snap["bottom"] = bottomObj

	edits := []any{}
	if raw, ok := snap["adminEdits"]; ok && raw != nil {
		b, _ := json.Marshal(raw)
		_ = json.Unmarshal(b, &edits)
	}
	edit := MeasAdminEdit{
		At:      time.Now().UTC().Format(time.RFC3339),
		By:      "admin",
		Product: item.ProductName,
		Changes: changes,
	}
	edits = append(edits, edit)
	snap["adminEdits"] = edits
	snap["lastAdminEditAt"] = edit.At

	raw, err := json.Marshal(snap)
	if err != nil {
		return nil, err
	}
	_, err = s.DB.ExecContext(ctx, `
		UPDATE order_items SET measurement_snapshot_json=$3
		WHERE id=$1 AND order_id=$2`, itemID, orderID, raw)
	if err != nil {
		return nil, err
	}
	_, _ = s.DB.ExecContext(ctx, `UPDATE orders SET updated_at=NOW() WHERE id=$1`, orderID)

	updated, err := s.GetOrder(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if updated.UserID != nil {
		oid := updated.ID
		parts := make([]string, 0, len(changes))
		for _, c := range changes {
			piece := c.Label
			if c.Section == "top" {
				piece = "shirt/top " + c.Label
			} else if c.Section == "bottom" {
				piece = "trousers/pant " + c.Label
			}
			parts = append(parts, fmt.Sprintf("%s (%s → %s)", piece, emptyDash(c.From), emptyDash(c.To)))
		}
		body := fmt.Sprintf(
			"For this order, your measurement for %s has been changed by the admin as per your request.",
			strings.Join(parts, ", "),
		)
		_ = s.NotifyUser(ctx, *updated.UserID, "Measurements updated", body, &oid, nil)
	}
	return updated, nil
}

func emptyDash(s string) string {
	if strings.TrimSpace(s) == "" {
		return "—"
	}
	return s
}

// UpdateOrderShipping lets admin change the delivery address from Queries
// when the customer requests it (before delivered / cancelled).
func (s *Store) UpdateOrderShipping(ctx context.Context, orderID uuid.UUID, in UpdateOrderShippingInput) (*OrderView, error) {
	o, err := s.GetOrder(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if !canEditOrderShipping(o.Status) {
		return nil, fmt.Errorf("address can’t be edited for status %s", o.Status)
	}

	before := shippingFieldMap(o.Shipping)
	after := map[string]string{
		"fullName": strings.TrimSpace(in.FullName),
		"email":    strings.TrimSpace(in.Email),
		"phone":    strings.TrimSpace(in.Phone),
		"address":  strings.TrimSpace(in.Address),
		"city":     strings.TrimSpace(in.City),
		"state":    strings.TrimSpace(in.State),
		"zip":      strings.TrimSpace(in.Zip),
		"country":  strings.TrimSpace(in.Country),
	}
	if after["fullName"] == "" {
		after["fullName"] = before["fullName"]
	}
	if after["email"] == "" {
		after["email"] = before["email"]
	}
	if after["phone"] == "" {
		after["phone"] = before["phone"]
	}
	changed := false
	for _, k := range []string{"fullName", "email", "phone", "address", "city", "state", "zip", "country"} {
		if before[k] != after[k] {
			changed = true
			break
		}
	}
	if !changed {
		return nil, errors.New("no address changes")
	}
	if after["address"] == "" || after["city"] == "" {
		return nil, errors.New("address and city are required")
	}

	shipMap := map[string]any{}
	if len(o.Shipping) > 0 {
		_ = json.Unmarshal(o.Shipping, &shipMap)
	}
	for k, v := range after {
		shipMap[k] = v
	}

	edits := []any{}
	if raw, ok := shipMap["adminAddressEdits"]; ok && raw != nil {
		b, _ := json.Marshal(raw)
		_ = json.Unmarshal(b, &edits)
	}
	edit := AddressAdminEdit{
		At:   time.Now().UTC().Format(time.RFC3339),
		By:   "admin",
		From: before,
		To:   after,
	}
	edits = append(edits, edit)
	shipMap["adminAddressEdits"] = edits
	shipMap["lastAdminAddressEditAt"] = edit.At
	shipMap["addressChangedAsRequested"] = true

	raw, err := json.Marshal(shipMap)
	if err != nil {
		return nil, err
	}
	_, err = s.DB.ExecContext(ctx, `
		UPDATE orders SET shipping_json=$2, updated_at=NOW()
		WHERE id=$1`, orderID, raw)
	if err != nil {
		return nil, err
	}

	updated, err := s.GetOrder(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if updated.UserID != nil {
		oid := updated.ID
		loc := formatShippingLocation(after)
		body := fmt.Sprintf(
			"As you requested, the address for this particular order has been changed to %s.",
			loc,
		)
		_ = s.NotifyUser(ctx, *updated.UserID, "Delivery address updated", body, &oid, nil)
	}
	return updated, nil
}

func (s *Store) CancelOrderByCustomer(ctx context.Context, orderID, userID uuid.UUID) (*OrderView, error) {
	o, err := s.GetOrder(ctx, orderID)
	if err != nil || o.UserID == nil || *o.UserID != userID {
		return nil, errors.New("order not found")
	}
	if o.Status != "pending" {
		return nil, errors.New("this order is already accepted and can’t be cancelled")
	}
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()
	note := "Cancelled by customer"
	if o.PaymentMethod == "online" && o.PaymentStatus == "paid" {
		_, err = tx.ExecContext(ctx, `
			UPDATE orders SET status='refunded', payment_status='refunded', admin_note=$2, updated_at=NOW()
			WHERE id=$1 AND status='pending'`, orderID, note)
	} else {
		_, err = tx.ExecContext(ctx, `
			UPDATE orders SET status='cancelled', admin_note=$2, updated_at=NOW()
			WHERE id=$1 AND status='pending'`, orderID, note)
	}
	if err != nil {
		return nil, err
	}
	if err = restoreOrderStock(tx, ctx, orderID); err != nil {
		return nil, err
	}
	if err = tx.Commit(); err != nil {
		return nil, err
	}
	return s.GetOrder(ctx, orderID)
}

func restoreOrderStock(tx *sql.Tx, ctx context.Context, orderID uuid.UUID) error {
	// Single set-based update — no per-row round trips
	_, err := tx.ExecContext(ctx, `
		UPDATE product_variants v
		SET stock = COALESCE(v.stock, 0) + oi.qty
		FROM order_items oi
		WHERE oi.order_id=$1
			AND oi.variant_id IS NOT NULL
			AND v.id = oi.variant_id`, orderID)
	return err
}

func (s *Store) ListCustomers(ctx context.Context, limit, offset int) ([]CustomerListItem, int, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var total int
	if err := s.DB.QueryRowContext(ctx, `SELECT COUNT(*) FROM users WHERE role='customer'`).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := s.DB.QueryContext(ctx, `
		SELECT u.id, u.name, u.email, u.phone, COALESCE(u.avatar_url,''), COALESCE(u.address_json,'{}'::jsonb),
			u.created_at, COALESCE(oc.cnt, 0)
		FROM users u
		LEFT JOIN (
			SELECT user_id, COUNT(*)::int AS cnt
			FROM orders
			GROUP BY user_id
		) oc ON oc.user_id = u.id
		WHERE u.role='customer'
		ORDER BY u.created_at DESC
		LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := make([]CustomerListItem, 0)
	for rows.Next() {
		var c CustomerListItem
		if err := rows.Scan(&c.ID, &c.Name, &c.Email, &c.Phone, &c.AvatarURL, &c.Address, &c.CreatedAt, &c.OrderCount); err != nil {
			return nil, 0, err
		}
		out = append(out, c)
	}
	return out, total, rows.Err()
}

func (s *Store) UpdateCustomerProfile(ctx context.Context, userID uuid.UUID, name, phone, avatarURL string, address json.RawMessage, measurements json.RawMessage, gender *string) error {
	if len(address) == 0 {
		address = json.RawMessage(`{}`)
	}
	setGender := gender != nil
	g := ""
	if setGender {
		g = strings.TrimSpace(*gender)
	}

	if measurements == nil && !setGender {
		_, err := s.DB.ExecContext(ctx, `
			UPDATE users SET name=$2, phone=$3, avatar_url=$4, address_json=$5
			WHERE id=$1 AND role='customer'`,
			userID, name, phone, avatarURL, []byte(address))
		return err
	}
	if measurements == nil && setGender {
		_, err := s.DB.ExecContext(ctx, `
			UPDATE users SET name=$2, phone=$3, avatar_url=$4, address_json=$5, gender=$6
			WHERE id=$1 AND role='customer'`,
			userID, name, phone, avatarURL, []byte(address), g)
		return err
	}
	if len(measurements) == 0 {
		measurements = json.RawMessage(`[]`)
	}
	if setGender {
		_, err := s.DB.ExecContext(ctx, `
			UPDATE users SET name=$2, phone=$3, avatar_url=$4, address_json=$5, measurements_json=$6, gender=$7
			WHERE id=$1 AND role='customer'`,
			userID, name, phone, avatarURL, []byte(address), []byte(measurements), g)
		return err
	}
	_, err := s.DB.ExecContext(ctx, `
		UPDATE users SET name=$2, phone=$3, avatar_url=$4, address_json=$5, measurements_json=$6
		WHERE id=$1 AND role='customer'`,
		userID, name, phone, avatarURL, []byte(address), []byte(measurements))
	return err
}

// evalPromoCode validates a coupon/promo/offer against live promotions.
func (s *Store) evalPromoCode(ctx context.Context, tx *sql.Tx, code string, subtotal float64, productIDs []uuid.UUID, productTotals map[uuid.UUID]float64, userID *uuid.UUID) (discount float64, title string, giftID *uuid.UUID, err error) {
	code = strings.TrimSpace(code)
	if code == "" {
		return 0, "", nil, nil
	}
	q := s.DB.QueryRowContext
	query := s.DB.QueryContext
	if tx != nil {
		q = tx.QueryRowContext
		query = tx.QueryContext
	}

	var id uuid.UUID
	var dtype, scope, titleDB, limitType string
	var dval, minSub float64
	var limitCount, redemptionCount int
	var gift *uuid.UUID
	var active bool
	var starts, ends sql.NullTime
	err = q(ctx, `
		SELECT id, title, discount_type, discount_value, scope, min_subtotal, gift_product_id,
			usage_limit_type, usage_limit_count, redemption_count, is_active, starts_at, ends_at
		FROM promotions
		WHERE LOWER(code)=LOWER($1)`, code).Scan(
		&id, &titleDB, &dtype, &dval, &scope, &minSub, &gift,
		&limitType, &limitCount, &redemptionCount, &active, &starts, &ends)
	if err != nil {
		return 0, "", nil, errors.New("invalid promo code")
	}
	now := time.Now()
	if !active {
		return 0, "", nil, errors.New("this offer is not active")
	}
	if starts.Valid && starts.Time.After(now) {
		return 0, "", nil, errors.New("this offer has not started yet")
	}
	if ends.Valid && ends.Time.Before(now) {
		return 0, "", nil, errors.New("this offer has ended")
	}
	if limitType == "first_n" && limitCount > 0 && redemptionCount >= limitCount {
		return 0, "", nil, errors.New("this offer has reached its usage limit")
	}
	if limitType == "once_per_user" || limitType == "first_n" {
		if userID == nil {
			return 0, "", nil, errors.New("log in to use this offer")
		}
		var n int
		_ = q(ctx, `
			SELECT COUNT(1) FROM promotion_redemptions
			WHERE promotion_id=$1 AND user_id=$2`, id, *userID).Scan(&n)
		if n > 0 {
			return 0, "", nil, errors.New("you have already used this offer")
		}
	}
	if subtotal < minSub {
		return 0, "", nil, fmt.Errorf("add more to unlock this offer (min $%.2f)", minSub)
	}

	eligibleBase := subtotal
	applies := scope == "cart" || dtype == "gift_threshold"
	if scope == "product" {
		rows, qerr := query(ctx, `SELECT product_id FROM promotion_products WHERE promotion_id=$1`, id)
		if qerr == nil {
			allowed := map[uuid.UUID]bool{}
			for rows.Next() {
				var pid uuid.UUID
				_ = rows.Scan(&pid)
				allowed[pid] = true
			}
			rows.Close()
			eligibleBase = 0
			for _, pid := range productIDs {
				if allowed[pid] {
					applies = true
					if productTotals != nil {
						eligibleBase += productTotals[pid]
					}
				}
			}
			if applies && eligibleBase <= 0 {
				eligibleBase = subtotal
			}
		}
	}
	if !applies {
		return 0, "", nil, errors.New("this code does not apply to items in your bag")
	}

	switch dtype {
	case "fixed":
		discount = dval
		if discount > eligibleBase {
			discount = eligibleBase
		}
	case "percent":
		discount = eligibleBase * (dval / 100)
		if discount > eligibleBase {
			discount = eligibleBase
		}
	case "gift_threshold":
		discount = 0
		giftID = gift
	default:
		return 0, "", nil, errors.New("unsupported offer type")
	}
	return discount, titleDB, giftID, nil
}

// evalGiftThreshold picks the highest-threshold active gift offer the cart unlocks.
func (s *Store) evalGiftThreshold(ctx context.Context, tx *sql.Tx, subtotal float64, userID *uuid.UUID) (giftID *uuid.UUID, title string, promoID *uuid.UUID) {
	query := s.DB.QueryContext
	if tx != nil {
		query = tx.QueryContext
	}
	rows, err := query(ctx, `
		SELECT id, title, gift_product_id, usage_limit_type
		FROM promotions
		WHERE is_active=TRUE
			AND discount_type='gift_threshold'
			AND gift_product_id IS NOT NULL
			AND min_subtotal <= $1
			AND (starts_at IS NULL OR starts_at <= NOW())
			AND (ends_at IS NULL OR ends_at >= NOW())
			AND (
				usage_limit_type <> 'first_n'
				OR usage_limit_count <= 0
				OR redemption_count < usage_limit_count
			)
		ORDER BY min_subtotal DESC`, subtotal)
	if err != nil {
		return nil, "", nil
	}
	defer rows.Close()

	q := s.DB.QueryRowContext
	if tx != nil {
		q = tx.QueryRowContext
	}
	for rows.Next() {
		var id, gid uuid.UUID
		var titleDB, limitType string
		if err := rows.Scan(&id, &titleDB, &gid, &limitType); err != nil {
			continue
		}
		if limitType == "once_per_user" || limitType == "first_n" {
			if userID == nil {
				continue
			}
			var n int
			_ = q(ctx, `
				SELECT COUNT(1) FROM promotion_redemptions
				WHERE promotion_id=$1 AND user_id=$2`, id, *userID).Scan(&n)
			if n > 0 {
				continue
			}
		}
		return &gid, titleDB, &id
	}
	return nil, "", nil
}

func (s *Store) attachGiftQuoteMeta(ctx context.Context, out *OrderQuote) {
	if out == nil || out.GiftProductID == nil {
		return
	}
	var name, img string
	err := s.DB.QueryRowContext(ctx, `
		SELECT p.name, COALESCE((
			SELECT url FROM product_images WHERE product_id=p.id ORDER BY sort_order ASC LIMIT 1
		),'')
		FROM products p WHERE p.id=$1`, *out.GiftProductID).Scan(&name, &img)
	if err == nil {
		out.GiftProductName = name
		out.GiftProductImage = img
	}
}

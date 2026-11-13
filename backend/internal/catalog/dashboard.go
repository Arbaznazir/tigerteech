package catalog

import (
	"context"
	"time"
)

type DashboardKPI struct {
	Products       int     `json:"products"`
	ActiveProducts int     `json:"activeProducts"`
	Categories     int     `json:"categories"`
	Banners        int     `json:"banners"`
	Deals          int     `json:"deals"`
	Customers      int     `json:"customers"`
	Orders         int     `json:"orders"`
	PendingOrders  int     `json:"pendingOrders"`
	Revenue        float64 `json:"revenue"`
	Revenue7d      float64 `json:"revenue7d"`
	Orders7d       int     `json:"orders7d"`
	AvgOrderValue  float64 `json:"avgOrderValue"`
}

type NamedCount struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Value int    `json:"value"`
}

type DayPoint struct {
	Day     string  `json:"day"` // YYYY-MM-DD
	Orders  int     `json:"orders"`
	Revenue float64 `json:"revenue"`
}

type RecentOrderRow struct {
	ID            string    `json:"id"`
	Status        string    `json:"status"`
	StatusLabel   string    `json:"statusLabel"`
	PaymentMethod string    `json:"paymentMethod"`
	Email         string    `json:"email"`
	CustomerName  string    `json:"customerName"`
	Total         float64   `json:"total"`
	CreatedAt     time.Time `json:"createdAt"`
}

type DashboardStats struct {
	KPI             DashboardKPI    `json:"kpi"`
	OrdersByStatus  []NamedCount    `json:"ordersByStatus"`
	PaymentMix      []NamedCount    `json:"paymentMix"`
	RevenueSeries   []DayPoint      `json:"revenueSeries"`
	RecentOrders    []RecentOrderRow `json:"recentOrders"`
	RangeDays       int             `json:"rangeDays"`
}

func (s *Store) DashboardStats(ctx context.Context, days int) (*DashboardStats, error) {
	if days <= 0 || days > 90 {
		days = 30
	}
	out := &DashboardStats{
		OrdersByStatus: make([]NamedCount, 0, 6),
		PaymentMix:     make([]NamedCount, 0, 2),
		RevenueSeries:  make([]DayPoint, 0, days),
		RecentOrders:   make([]RecentOrderRow, 0, 8),
		RangeDays:      days,
	}

	_ = s.DB.QueryRowContext(ctx, `SELECT COUNT(*) FROM products`).Scan(&out.KPI.Products)
	_ = s.DB.QueryRowContext(ctx, `SELECT COUNT(*) FROM products WHERE status='active'`).Scan(&out.KPI.ActiveProducts)
	_ = s.DB.QueryRowContext(ctx, `SELECT COUNT(*) FROM categories`).Scan(&out.KPI.Categories)
	_ = s.DB.QueryRowContext(ctx, `SELECT COUNT(*) FROM banners`).Scan(&out.KPI.Banners)
	_ = s.DB.QueryRowContext(ctx, `SELECT COUNT(*) FROM deals`).Scan(&out.KPI.Deals)
	_ = s.DB.QueryRowContext(ctx, `SELECT COUNT(*) FROM users WHERE role='customer'`).Scan(&out.KPI.Customers)
	_ = s.DB.QueryRowContext(ctx, `SELECT COUNT(*) FROM orders`).Scan(&out.KPI.Orders)
	_ = s.DB.QueryRowContext(ctx, `SELECT COUNT(*) FROM orders WHERE status='pending'`).Scan(&out.KPI.PendingOrders)

	_ = s.DB.QueryRowContext(ctx, `
		SELECT COALESCE(SUM((totals_json->>'total')::numeric), 0)
		FROM orders
		WHERE status NOT IN ('rejected','refunded','cancelled')`).Scan(&out.KPI.Revenue)

	_ = s.DB.QueryRowContext(ctx, `
		SELECT COUNT(*), COALESCE(SUM((totals_json->>'total')::numeric), 0)
		FROM orders
		WHERE created_at >= NOW() - INTERVAL '7 days'
			AND status NOT IN ('rejected','refunded','cancelled')`).Scan(&out.KPI.Orders7d, &out.KPI.Revenue7d)

	if out.KPI.Orders > 0 {
		var completed int
		_ = s.DB.QueryRowContext(ctx, `
			SELECT COUNT(*) FROM orders WHERE status NOT IN ('rejected','refunded','cancelled')`).Scan(&completed)
		if completed > 0 {
			out.KPI.AvgOrderValue = out.KPI.Revenue / float64(completed)
		}
	}

	statusRows, err := s.DB.QueryContext(ctx, `
		SELECT status, COUNT(*)::int
		FROM orders
		GROUP BY status`)
	if err != nil {
		return nil, err
	}
	statusMap := map[string]int{}
	for statusRows.Next() {
		var st string
		var n int
		if err := statusRows.Scan(&st, &n); err != nil {
			statusRows.Close()
			return nil, err
		}
		statusMap[st] = n
	}
	statusRows.Close()
	// Surface cancelled separately so the dashboard graph shows rejected vs cancelled.
	for _, st := range []string{"pending", "accepted", "out_for_delivery", "delivered", "rejected", "cancelled", "refunded"} {
		out.OrdersByStatus = append(out.OrdersByStatus, NamedCount{
			ID: st, Label: OrderStatusLabel(st), Value: statusMap[st],
		})
	}

	payRows, err := s.DB.QueryContext(ctx, `
		SELECT COALESCE(payment_method,'cod'), COUNT(*)::int
		FROM orders
		GROUP BY COALESCE(payment_method,'cod')`)
	if err != nil {
		return nil, err
	}
	for payRows.Next() {
		var method string
		var n int
		if err := payRows.Scan(&method, &n); err != nil {
			payRows.Close()
			return nil, err
		}
		label := "COD"
		if method == "online" {
			label = "Online"
		}
		out.PaymentMix = append(out.PaymentMix, NamedCount{ID: method, Label: label, Value: n})
	}
	payRows.Close()

	seriesRows, err := s.DB.QueryContext(ctx, `
		WITH days AS (
			SELECT generate_series(
				(CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day')::date,
				CURRENT_DATE,
				'1 day'::interval
			)::date AS day
		)
		SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
			COALESCE(COUNT(o.id), 0)::int AS orders,
			COALESCE(SUM((o.totals_json->>'total')::numeric) FILTER (
				WHERE o.status NOT IN ('rejected','refunded','cancelled')
			), 0) AS revenue
		FROM days d
		LEFT JOIN orders o ON o.created_at::date = d.day
		GROUP BY d.day
		ORDER BY d.day ASC`, days)
	if err != nil {
		return nil, err
	}
	for seriesRows.Next() {
		var p DayPoint
		if err := seriesRows.Scan(&p.Day, &p.Orders, &p.Revenue); err != nil {
			seriesRows.Close()
			return nil, err
		}
		out.RevenueSeries = append(out.RevenueSeries, p)
	}
	seriesRows.Close()

	recent, err := s.DB.QueryContext(ctx, `
		SELECT o.id, o.status, COALESCE(o.payment_method,'cod'), o.email,
			COALESCE(u.name, COALESCE(o.shipping_json->>'fullName','')),
			COALESCE((o.totals_json->>'total')::numeric, 0),
			o.created_at
		FROM orders o
		LEFT JOIN users u ON u.id=o.user_id
		ORDER BY o.created_at DESC
		LIMIT 8`)
	if err != nil {
		return nil, err
	}
	defer recent.Close()
	for recent.Next() {
		var r RecentOrderRow
		if err := recent.Scan(
			&r.ID, &r.Status, &r.PaymentMethod, &r.Email,
			&r.CustomerName, &r.Total, &r.CreatedAt,
		); err != nil {
			return nil, err
		}
		r.StatusLabel = OrderStatusLabel(r.Status)
		out.RecentOrders = append(out.RecentOrders, r)
	}

	return out, recent.Err()
}

package catalog

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
)

const supportBurstLimit = 3
const supportReopenLimit = 2

type SupportMessage struct {
	ID        uuid.UUID `json:"id"`
	TicketID  uuid.UUID `json:"ticketId"`
	Sender    string    `json:"sender"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"createdAt"`
}

type SupportTicket struct {
	ID               uuid.UUID        `json:"id"`
	UserID           uuid.UUID        `json:"userId"`
	OrderID          uuid.UUID        `json:"orderId"`
	Status           string           `json:"status"`
	UserBurst        int              `json:"userBurst"`
	ReopenCount      int              `json:"reopenCount"`
	ReopensRemaining int              `json:"reopensRemaining"`
	AdminUnread      bool             `json:"adminUnread"`
	CanSend          bool             `json:"canSend"`
	CanReopen        bool             `json:"canReopen"`
	CreatedAt        time.Time        `json:"createdAt"`
	UpdatedAt        time.Time        `json:"updatedAt"`
	Preview          string           `json:"preview,omitempty"`
	UserName         string           `json:"userName,omitempty"`
	UserPhone        string           `json:"userPhone,omitempty"`
	UserEmail        string           `json:"userEmail,omitempty"`
	OrderName        string           `json:"orderName,omitempty"`
	Messages         []SupportMessage `json:"messages,omitempty"`
	Order            *OrderView       `json:"order,omitempty"`
}

func decorateSupportTicket(t *SupportTicket) {
	t.CanSend = t.Status == "open" && t.UserBurst < supportBurstLimit
	remaining := supportReopenLimit - t.ReopenCount
	if remaining < 0 {
		remaining = 0
	}
	t.ReopensRemaining = remaining
	t.CanReopen = t.Status == "resolved" && t.ReopenCount < supportReopenLimit
}

type Notification struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"userId"`
	TicketID  *uuid.UUID `json:"ticketId,omitempty"`
	OrderID   *uuid.UUID `json:"orderId,omitempty"`
	Title     string     `json:"title"`
	Body      string     `json:"body"`
	ReadAt    *time.Time `json:"readAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
}

func (s *Store) NotifyUser(ctx context.Context, userID uuid.UUID, title, body string, orderID, ticketID *uuid.UUID) error {
	_, err := s.DB.ExecContext(ctx, `
		INSERT INTO notifications (id, user_id, ticket_id, order_id, title, body)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		uuid.New(), userID, ticketID, orderID, title, body)
	return err
}

func (s *Store) OpenSupportTicket(ctx context.Context, userID, orderID uuid.UUID) (*SupportTicket, error) {
	o, err := s.GetOrder(ctx, orderID)
	if err != nil || o.UserID == nil || *o.UserID != userID {
		return nil, errors.New("order not found")
	}
	var existing uuid.UUID
	err = s.DB.QueryRowContext(ctx, `
		SELECT id FROM support_tickets WHERE user_id=$1 AND order_id=$2`, userID, orderID).Scan(&existing)
	if err == nil {
		// Existing chat — do not silently reopen; customer uses Reopen when resolved.
		return s.GetSupportTicket(ctx, existing, userID)
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}
	id := uuid.New()
	_, err = s.DB.ExecContext(ctx, `
		INSERT INTO support_tickets (id, user_id, order_id)
		VALUES ($1, $2, $3)`, id, userID, orderID)
	if err != nil {
		return nil, err
	}
	return s.supportTicketForUser(ctx, userID, orderID)
}

func (s *Store) supportTicketForUser(ctx context.Context, userID, orderID uuid.UUID) (*SupportTicket, error) {
	var t SupportTicket
	err := s.DB.QueryRowContext(ctx, `
		SELECT id, user_id, order_id, status, user_burst, COALESCE(reopen_count,0), COALESCE(admin_unread,false), created_at, updated_at
		FROM support_tickets WHERE user_id=$1 AND order_id=$2`, userID, orderID).Scan(
		&t.ID, &t.UserID, &t.OrderID, &t.Status, &t.UserBurst, &t.ReopenCount, &t.AdminUnread, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	decorateSupportTicket(&t)
	t.Messages, err = s.supportMessages(ctx, t.ID)
	return &t, err
}

func (s *Store) GetSupportTicket(ctx context.Context, ticketID, userID uuid.UUID) (*SupportTicket, error) {
	var t SupportTicket
	err := s.DB.QueryRowContext(ctx, `
		SELECT id, user_id, order_id, status, user_burst, COALESCE(reopen_count,0), COALESCE(admin_unread,false), created_at, updated_at
		FROM support_tickets WHERE id=$1 AND user_id=$2`, ticketID, userID).Scan(
		&t.ID, &t.UserID, &t.OrderID, &t.Status, &t.UserBurst, &t.ReopenCount, &t.AdminUnread, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("ticket not found")
		}
		return nil, err
	}
	decorateSupportTicket(&t)
	t.Messages, err = s.supportMessages(ctx, t.ID)
	if err != nil {
		return nil, err
	}
	t.Order, _ = s.GetOrder(ctx, t.OrderID)
	return &t, nil
}

func (s *Store) ListSupportTickets(ctx context.Context, userID uuid.UUID) ([]SupportTicket, error) {
	rows, err := s.DB.QueryContext(ctx, `
		SELECT t.id, t.user_id, t.order_id, t.status, t.user_burst, COALESCE(t.reopen_count,0), COALESCE(t.admin_unread,false), t.created_at, t.updated_at,
			COALESCE((
				SELECT m.body FROM support_messages m
				WHERE m.ticket_id=t.id ORDER BY m.created_at DESC LIMIT 1
			), '')
		FROM support_tickets t
		WHERE t.user_id=$1
		ORDER BY t.updated_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []SupportTicket{}
	for rows.Next() {
		var t SupportTicket
		if err := rows.Scan(&t.ID, &t.UserID, &t.OrderID, &t.Status, &t.UserBurst, &t.ReopenCount, &t.AdminUnread, &t.CreatedAt, &t.UpdatedAt, &t.Preview); err != nil {
			return nil, err
		}
		decorateSupportTicket(&t)
		if o, err := s.GetOrder(ctx, t.OrderID); err == nil {
			t.OrderName = orderDisplayName(o)
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *Store) PostSupportMessage(ctx context.Context, ticketID, userID uuid.UUID, body string) (*SupportTicket, error) {
	body = cleanSupportBody(body)
	if body == "" {
		return nil, errors.New("write a message")
	}
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()
	var status string
	var burst int
	err = tx.QueryRowContext(ctx, `
		SELECT status, user_burst FROM support_tickets
		WHERE id=$1 AND user_id=$2 FOR UPDATE`, ticketID, userID).Scan(&status, &burst)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("ticket not found")
		}
		return nil, err
	}
	if status != "open" {
		return nil, errors.New("this request is resolved")
	}
	if burst >= supportBurstLimit {
		return nil, errors.New("you can send 3 messages, then wait for a reply")
	}
	if _, err = tx.ExecContext(ctx, `
		INSERT INTO support_messages (id, ticket_id, sender, body)
		VALUES ($1, $2, 'user', $3)`, uuid.New(), ticketID, body); err != nil {
		return nil, err
	}
	if _, err = tx.ExecContext(ctx, `
		UPDATE support_tickets
		SET user_burst=user_burst+1, admin_unread=true, updated_at=NOW()
		WHERE id=$1`, ticketID); err != nil {
		return nil, err
	}
	if err = tx.Commit(); err != nil {
		return nil, err
	}
	return s.GetSupportTicket(ctx, ticketID, userID)
}

func (s *Store) ListSupportTicketsAdmin(ctx context.Context) ([]SupportTicket, error) {
	rows, err := s.DB.QueryContext(ctx, `
		SELECT t.id, t.user_id, t.order_id, t.status, t.user_burst, COALESCE(t.reopen_count,0), COALESCE(t.admin_unread,false), t.created_at, t.updated_at,
			COALESCE(u.name,''), COALESCE(u.phone,''), COALESCE(u.email,''),
			COALESCE((
				SELECT m.body FROM support_messages m
				WHERE m.ticket_id=t.id ORDER BY m.created_at DESC LIMIT 1
			), '')
		FROM support_tickets t
		JOIN users u ON u.id=t.user_id
		ORDER BY CASE WHEN t.status='open' AND COALESCE(t.admin_unread,false) THEN 0 WHEN t.status='open' THEN 1 ELSE 2 END, t.updated_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []SupportTicket{}
	for rows.Next() {
		var t SupportTicket
		if err := rows.Scan(
			&t.ID, &t.UserID, &t.OrderID, &t.Status, &t.UserBurst, &t.ReopenCount, &t.AdminUnread, &t.CreatedAt, &t.UpdatedAt,
			&t.UserName, &t.UserPhone, &t.UserEmail, &t.Preview,
		); err != nil {
			return nil, err
		}
		decorateSupportTicket(&t)
		if o, err := s.GetOrder(ctx, t.OrderID); err == nil {
			t.OrderName = orderDisplayName(o)
			if t.UserPhone == "" && len(o.Shipping) > 0 {
				t.UserPhone = shippingPhone(o.Shipping)
			}
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *Store) GetSupportTicketAdmin(ctx context.Context, ticketID uuid.UUID) (*SupportTicket, error) {
	var t SupportTicket
	err := s.DB.QueryRowContext(ctx, `
		SELECT t.id, t.user_id, t.order_id, t.status, t.user_burst, COALESCE(t.reopen_count,0), COALESCE(t.admin_unread,false), t.created_at, t.updated_at,
			COALESCE(u.name,''), COALESCE(u.phone,''), COALESCE(u.email,'')
		FROM support_tickets t
		JOIN users u ON u.id=t.user_id
		WHERE t.id=$1`, ticketID).Scan(
		&t.ID, &t.UserID, &t.OrderID, &t.Status, &t.UserBurst, &t.ReopenCount, &t.AdminUnread, &t.CreatedAt, &t.UpdatedAt,
		&t.UserName, &t.UserPhone, &t.UserEmail,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("ticket not found")
		}
		return nil, err
	}
	decorateSupportTicket(&t)
	t.Messages, err = s.supportMessages(ctx, t.ID)
	if err != nil {
		return nil, err
	}
	t.Order, err = s.GetOrder(ctx, t.OrderID)
	if err != nil {
		return nil, err
	}
	t.OrderName = orderDisplayName(t.Order)
	if t.UserPhone == "" {
		t.UserPhone = shippingPhone(t.Order.Shipping)
	}
	return &t, nil
}

func (s *Store) PostSupportReply(ctx context.Context, ticketID uuid.UUID, body string) (*SupportTicket, error) {
	body = cleanSupportBody(body)
	if body == "" {
		return nil, errors.New("write a message")
	}
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()
	var userID uuid.UUID
	var status string
	err = tx.QueryRowContext(ctx, `
		SELECT user_id, status FROM support_tickets WHERE id=$1 FOR UPDATE`, ticketID).Scan(&userID, &status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("ticket not found")
		}
		return nil, err
	}
	if status != "open" {
		return nil, errors.New("this ticket is resolved")
	}
	if _, err = tx.ExecContext(ctx, `
		INSERT INTO support_messages (id, ticket_id, sender, body)
		VALUES ($1, $2, 'admin', $3)`, uuid.New(), ticketID, body); err != nil {
		return nil, err
	}
	if _, err = tx.ExecContext(ctx, `
		UPDATE support_tickets SET user_burst=0, admin_unread=false, updated_at=NOW() WHERE id=$1`, ticketID); err != nil {
		return nil, err
	}
	preview := body
	if utf8.RuneCountInString(preview) > 140 {
		preview = string([]rune(preview)[:140])
	}
	if _, err = tx.ExecContext(ctx, `
		INSERT INTO notifications (id, user_id, ticket_id, title, body)
		VALUES ($1, $2, $3, 'Reply about your order', $4)`,
		uuid.New(), userID, ticketID, preview); err != nil {
		return nil, err
	}
	if err = tx.Commit(); err != nil {
		return nil, err
	}
	return s.GetSupportTicketAdmin(ctx, ticketID)
}

func (s *Store) ResolveSupportTicket(ctx context.Context, ticketID uuid.UUID) (*SupportTicket, error) {
	res, err := s.DB.ExecContext(ctx, `
		UPDATE support_tickets
		SET status='resolved', admin_unread=false, updated_at=NOW()
		WHERE id=$1 AND status='open'`, ticketID)
	if err != nil {
		return nil, err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		var exists int
		_ = s.DB.QueryRowContext(ctx, `SELECT 1 FROM support_tickets WHERE id=$1`, ticketID).Scan(&exists)
		if exists != 1 {
			return nil, errors.New("ticket not found")
		}
	}
	var userID uuid.UUID
	_ = s.DB.QueryRowContext(ctx, `SELECT user_id FROM support_tickets WHERE id=$1`, ticketID).Scan(&userID)
	if userID != uuid.Nil {
		_, _ = s.DB.ExecContext(ctx, `
			INSERT INTO notifications (id, user_id, ticket_id, title, body)
			VALUES ($1, $2, $3, 'Your request was resolved',
				'We closed this help request. You can reopen it up to 2 times if you still need help.')`,
			uuid.New(), userID, ticketID)
	}
	return s.GetSupportTicketAdmin(ctx, ticketID)
}

// ReopenSupportTicket lets the customer reopen a resolved chat (max 2 times).
func (s *Store) ReopenSupportTicket(ctx context.Context, ticketID, userID uuid.UUID) (*SupportTicket, error) {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback() }()

	var status string
	var reopenCount int
	err = tx.QueryRowContext(ctx, `
		SELECT status, COALESCE(reopen_count,0) FROM support_tickets
		WHERE id=$1 AND user_id=$2 FOR UPDATE`, ticketID, userID).Scan(&status, &reopenCount)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("ticket not found")
		}
		return nil, err
	}
	if status == "open" {
		return nil, errors.New("this query is already open")
	}
	if status != "resolved" {
		return nil, errors.New("this query can’t be reopened")
	}
	if reopenCount >= supportReopenLimit {
		return nil, errors.New("you’ve used both reopen chances for this order")
	}

	nextCount := reopenCount + 1
	if _, err = tx.ExecContext(ctx, `
		UPDATE support_tickets
		SET status='open', user_burst=0, admin_unread=true,
			reopen_count=$2, updated_at=NOW()
		WHERE id=$1`, ticketID, nextCount); err != nil {
		return nil, err
	}

	label := "Customer reopened this query"
	if nextCount == 1 {
		label = "Customer reopened this query (1 of 2)"
	} else {
		label = "Customer reopened this query again (2 of 2)"
	}
	if _, err = tx.ExecContext(ctx, `
		INSERT INTO support_messages (id, ticket_id, sender, body)
		VALUES ($1, $2, 'system', $3)`, uuid.New(), ticketID, label); err != nil {
		return nil, err
	}
	if err = tx.Commit(); err != nil {
		return nil, err
	}
	return s.GetSupportTicket(ctx, ticketID, userID)
}

func (s *Store) ListNotifications(ctx context.Context, userID uuid.UUID) ([]Notification, int, error) {
	rows, err := s.DB.QueryContext(ctx, `
		SELECT id, user_id, ticket_id, order_id, title, body, read_at, created_at
		FROM notifications WHERE user_id=$1
		ORDER BY created_at DESC LIMIT 50`, userID)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []Notification{}
	for rows.Next() {
		var n Notification
		var ticketID, orderID uuid.NullUUID
		if err := rows.Scan(&n.ID, &n.UserID, &ticketID, &orderID, &n.Title, &n.Body, &n.ReadAt, &n.CreatedAt); err != nil {
			return nil, 0, err
		}
		if ticketID.Valid {
			id := ticketID.UUID
			n.TicketID = &id
		}
		if orderID.Valid {
			id := orderID.UUID
			n.OrderID = &id
		}
		out = append(out, n)
	}
	var unread int
	_ = s.DB.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND read_at IS NULL`, userID).Scan(&unread)
	return out, unread, rows.Err()
}

func (s *Store) MarkNotificationRead(ctx context.Context, id, userID uuid.UUID) error {
	_, err := s.DB.ExecContext(ctx, `
		UPDATE notifications SET read_at=NOW()
		WHERE id=$1 AND user_id=$2 AND read_at IS NULL`, id, userID)
	return err
}

func (s *Store) MarkSupportTicketReadAdmin(ctx context.Context, ticketID uuid.UUID) (*SupportTicket, error) {
	_, err := s.DB.ExecContext(ctx, `
		UPDATE support_tickets SET admin_unread=false WHERE id=$1`, ticketID)
	if err != nil {
		return nil, err
	}
	return s.GetSupportTicketAdmin(ctx, ticketID)
}

func (s *Store) MarkTicketNotificationsRead(ctx context.Context, userID, ticketID uuid.UUID) error {
	_, err := s.DB.ExecContext(ctx, `
		UPDATE notifications SET read_at=NOW()
		WHERE user_id=$1 AND ticket_id=$2 AND read_at IS NULL`, userID, ticketID)
	return err
}

type AdminInboxOrder struct {
	ID           uuid.UUID `json:"id"`
	CustomerName string    `json:"customerName"`
	OrderName     string    `json:"orderName"`
	Total        float64   `json:"total"`
	PaymentMethod string   `json:"paymentMethod"`
	CreatedAt    time.Time `json:"createdAt"`
}

type AdminInboxQuery struct {
	ID        uuid.UUID `json:"id"`
	UserName  string    `json:"userName"`
	UserPhone string    `json:"userPhone"`
	OrderName string    `json:"orderName"`
	Preview   string    `json:"preview"`
	UserBurst int       `json:"userBurst"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type AdminInbox struct {
	PendingOrders int               `json:"pendingOrders"`
	OpenQueries   int               `json:"openQueries"`
	AwaitingReply int               `json:"awaitingReply"`
	Orders        []AdminInboxOrder `json:"orders"`
	Queries       []AdminInboxQuery `json:"queries"`
}

func (s *Store) AdminInbox(ctx context.Context) (*AdminInbox, error) {
	out := &AdminInbox{
		Orders:  []AdminInboxOrder{},
		Queries: []AdminInboxQuery{},
	}
	if err := s.DB.QueryRowContext(ctx, `
		SELECT COUNT(*)::int FROM orders WHERE status='pending'`).Scan(&out.PendingOrders); err != nil {
		return nil, err
	}
	if err := s.DB.QueryRowContext(ctx, `
		SELECT COUNT(*)::int FROM support_tickets WHERE status='open'`).Scan(&out.OpenQueries); err != nil {
		return nil, err
	}
	if err := s.DB.QueryRowContext(ctx, `
		SELECT COUNT(*)::int FROM support_tickets WHERE status='open' AND COALESCE(admin_unread,false)=true`).Scan(&out.AwaitingReply); err != nil {
		return nil, err
	}

	orderRows, err := s.DB.QueryContext(ctx, `
		SELECT o.id, COALESCE(u.name,''), COALESCE(o.payment_method,'cod'), o.created_at,
			COALESCE((o.totals_json->>'total')::float8, 0)
		FROM orders o
		LEFT JOIN users u ON u.id=o.user_id
		WHERE o.status='pending'
		ORDER BY o.created_at DESC
		LIMIT 8`)
	if err != nil {
		return nil, err
	}
	defer orderRows.Close()
	for orderRows.Next() {
		var row AdminInboxOrder
		if err := orderRows.Scan(&row.ID, &row.CustomerName, &row.PaymentMethod, &row.CreatedAt, &row.Total); err != nil {
			return nil, err
		}
		if o, err := s.GetOrder(ctx, row.ID); err == nil {
			row.OrderName = orderDisplayName(o)
			if row.CustomerName == "" && o.Customer != nil {
				row.CustomerName = o.Customer.Name
			}
		}
		if row.OrderName == "" {
			row.OrderName = "New order"
		}
		out.Orders = append(out.Orders, row)
	}
	if err := orderRows.Err(); err != nil {
		return nil, err
	}

	queryRows, err := s.DB.QueryContext(ctx, `
		SELECT t.id, t.order_id, COALESCE(u.name,''), COALESCE(u.phone,''), t.user_burst, t.updated_at,
			COALESCE((
				SELECT m.body FROM support_messages m
				WHERE m.ticket_id=t.id ORDER BY m.created_at DESC LIMIT 1
			), '')
		FROM support_tickets t
		JOIN users u ON u.id=t.user_id
		WHERE t.status='open' AND COALESCE(t.admin_unread,false)=true
		ORDER BY t.updated_at DESC
		LIMIT 12`)
	if err != nil {
		return nil, err
	}
	defer queryRows.Close()
	for queryRows.Next() {
		var row AdminInboxQuery
		var orderID uuid.UUID
		if err := queryRows.Scan(
			&row.ID, &orderID, &row.UserName, &row.UserPhone, &row.UserBurst, &row.UpdatedAt, &row.Preview,
		); err != nil {
			return nil, err
		}
		if o, err := s.GetOrder(ctx, orderID); err == nil {
			row.OrderName = orderDisplayName(o)
		}
		if row.OrderName == "" {
			row.OrderName = "Order help"
		}
		out.Queries = append(out.Queries, row)
	}
	return out, queryRows.Err()
}

func (s *Store) supportMessages(ctx context.Context, ticketID uuid.UUID) ([]SupportMessage, error) {
	rows, err := s.DB.QueryContext(ctx, `
		SELECT id, ticket_id, sender, body, created_at
		FROM support_messages WHERE ticket_id=$1 ORDER BY created_at ASC`, ticketID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []SupportMessage{}
	for rows.Next() {
		var m SupportMessage
		if err := rows.Scan(&m.ID, &m.TicketID, &m.Sender, &m.Body, &m.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func cleanSupportBody(body string) string {
	body = strings.TrimSpace(body)
	if utf8.RuneCountInString(body) > 1000 {
		body = string([]rune(body)[:1000])
	}
	return body
}

func orderDisplayName(o *OrderView) string {
	if o == nil || len(o.Items) == 0 {
		return "Order"
	}
	names := make([]string, 0, len(o.Items))
	for _, it := range o.Items {
		if strings.TrimSpace(it.ProductName) != "" {
			names = append(names, it.ProductName)
		}
	}
	if len(names) == 0 {
		return "Order"
	}
	if len(names) == 1 {
		return names[0]
	}
	if len(names) == 2 {
		return names[0] + " & " + names[1]
	}
	return names[0] + ", " + names[1]
}

package httpapi

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"

	"github.com/tigerteeh/tigerteehcloothing/backend/internal/auth"
	"github.com/tigerteeh/tigerteehcloothing/backend/internal/catalog"
	"github.com/tigerteeh/tigerteehcloothing/backend/internal/config"
	"github.com/tigerteeh/tigerteehcloothing/backend/internal/emailguard"
	"github.com/tigerteeh/tigerteehcloothing/backend/internal/marketing"
	"github.com/tigerteeh/tigerteehcloothing/backend/internal/media"
)

type API struct {
	Cfg    config.Config
	Auth   *auth.Service
	Cat    *catalog.Store
	Mkt    *marketing.Store
	Media  *media.Service
	Emails *emailguard.Guard
	DB     *sql.DB
}

func NewRouter(a *API) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	allowed := make(map[string]struct{}, len(a.Cfg.AllowedOrigins))
	for _, o := range a.Cfg.AllowedOrigins {
		if o != "" {
			allowed[strings.TrimRight(o, "/")] = struct{}{}
		}
	}
	r.Use(cors.Handler(cors.Options{
		// Exact configured origins + any https://*.vercel.app (store + admin + previews).
		AllowOriginFunc: func(_ *http.Request, origin string) bool {
			origin = strings.TrimRight(origin, "/")
			if origin == "" {
				return false
			}
			if _, ok := allowed[origin]; ok {
				return true
			}
			return strings.HasPrefix(origin, "https://") &&
				(strings.HasSuffix(origin, ".vercel.app") || origin == "https://vercel.app")
		},
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{
			"Accept",
			"Authorization",
			"Content-Type",
			"Cache-Control",
			"Pragma",
			"X-Requested-With",
		},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		JSON(w, http.StatusOK, map[string]any{
			"ok":      true,
			"service": "tigerteeh-backend",
		})
	})

	fileServer := http.StripPrefix("/uploads/", http.FileServer(http.Dir(a.Cfg.UploadDir)))
	r.Handle("/uploads/*", cacheUploads(fileServer))

	r.Route("/api/v1", func(r chi.Router) {
		r.Use(noStoreJSON)

		r.Post("/auth/login", a.login)
		r.Post("/auth/register", a.register)
		r.Post("/auth/validate-email", a.validateEmail)

		r.Get("/categories", a.listCategoriesPublic)
		r.Get("/products", a.listProductsPublic)
		r.Get("/products/{slug}", a.getProductBySlug)
		r.Get("/banners", a.listBannersPublic)
		r.Get("/banner-slots", a.listSlots)
		r.Get("/deals/active", a.listActiveDeals)
		r.Get("/deals/banner", a.getDealBanner)
		r.With(a.Auth.OptionalAuth).Get("/promotions/active", a.listActivePromotions)
		r.With(a.Auth.OptionalAuth).Post("/promotions/validate", a.validatePromotion)
		r.With(a.Auth.OptionalAuth).Get("/products/{slug}/promotions", a.listProductPromotions)
		r.Get("/tags", a.listTags)
		r.Get("/detail-fields", a.listDetailFields)
		r.Get("/settings/cod", a.getCodSettingsPublic)

		r.Group(func(r chi.Router) {
			r.Use(a.Auth.RequireUser)
			r.Post("/orders", a.createOrder)
			r.Post("/orders/quote", a.quoteOrder)
			r.Get("/orders", a.listOrdersCustomer)
			r.Get("/orders/{id}", a.getOrderCustomer)
			r.Post("/orders/{id}/cancel", a.cancelOrderCustomer)
			r.Get("/support/tickets", a.listSupportTickets)
			r.Post("/support/tickets", a.openSupportTicket)
			r.Get("/support/tickets/{id}", a.getSupportTicket)
			r.Post("/support/tickets/{id}/messages", a.postSupportMessage)
			r.Post("/support/tickets/{id}/reopen", a.reopenSupportTicket)
			r.Post("/support/tickets/{id}/read", a.readSupportTicketCustomer)
			r.Get("/notifications", a.listNotifications)
			r.Post("/notifications/{id}/read", a.readNotification)
			r.Get("/me", a.customerMe)
			r.Put("/me", a.updateCustomerMe)
			r.Post("/me/avatar", a.Media.Handler("avatars"))
		})

		r.Route("/admin", func(r chi.Router) {
			r.Use(a.Auth.RequireAdmin)

			r.Get("/me", a.adminMe)
			r.Get("/dashboard", a.adminDashboard)
			r.Post("/media", a.Media.Handler("misc"))

			r.Get("/categories", a.listCategoriesAdmin)
			r.Post("/categories", a.createCategory)
			r.Get("/categories/{id}", a.getCategoryAdmin)
			r.Put("/categories/{id}", a.updateCategory)
			r.Delete("/categories/{id}", a.deleteCategory)
			r.Get("/categories/{id}/products", a.listCategoryProducts)
			r.Delete("/categories/{id}/products/{productId}", a.removeProductFromCategory)
			r.Post("/categories/{id}/products/{productId}/move", a.moveProductCategory)

			r.Get("/products", a.listProductsAdmin)
			r.Post("/products", a.createProduct)
			r.Get("/products/{id}", a.getProductAdmin)
			r.Put("/products/{id}", a.updateProduct)
			r.Delete("/products/{id}", a.deleteProduct)

			r.Get("/inventory", a.listInventory)
			r.Patch("/variants/{id}/inventory", a.adjustInventory)

			r.Get("/tags", a.listTags)
			r.Post("/tags", a.createTag)
			r.Put("/tags/{id}", a.updateTag)
			r.Delete("/tags/{id}", a.deleteTag)

			r.Get("/detail-fields", a.listDetailFields)
			r.Post("/detail-fields", a.createDetailField)
			r.Put("/detail-fields/{id}", a.updateDetailField)
			r.Delete("/detail-fields/{id}", a.deleteDetailField)

			r.Get("/banner-slots", a.listSlots)
			r.Get("/banners", a.listBannersAdmin)
			r.Post("/banners", a.createBanner)
			r.Put("/banners/{id}", a.updateBanner)
			r.Delete("/banners/{id}", a.deleteBanner)

			r.Get("/deals", a.listDealsAdmin)
			r.Post("/deals", a.createDeal)
			r.Put("/deals/{id}", a.updateDeal)
			r.Delete("/deals/{id}", a.deleteDeal)

			r.Get("/promotions", a.listPromotionsAdmin)
			r.Post("/promotions", a.createPromotion)
			r.Put("/promotions/{id}", a.updatePromotion)
			r.Delete("/promotions/{id}", a.deletePromotion)

			r.Get("/orders", a.listOrdersAdmin)
			r.Get("/orders/{id}", a.getOrderAdmin)
			r.Post("/orders/{id}/action", a.orderActionAdmin)
			r.Post("/orders/{id}/cancel-query", a.cancelOrderFromQueryAdmin)
			r.Patch("/orders/{id}/items/{itemId}/measurements", a.updateOrderItemMeasurementsAdmin)
			r.Patch("/orders/{id}/shipping", a.updateOrderShippingAdmin)
			r.Get("/inbox", a.adminInbox)

			r.Get("/support/tickets", a.listSupportTicketsAdmin)
			r.Get("/support/tickets/{id}", a.getSupportTicketAdmin)
			r.Post("/support/tickets/{id}/messages", a.postSupportReply)
			r.Post("/support/tickets/{id}/read", a.readSupportTicketAdmin)
			r.Post("/support/tickets/{id}/resolve", a.resolveSupportTicket)

			r.Get("/users", a.listUsersAdmin)
			r.Get("/users/{id}", a.getUserAdmin)

			r.Get("/settings/cod", a.getCodSettingsAdmin)
			r.Put("/settings/cod", a.putCodSettingsAdmin)
		})
	})

	return r
}

func (a *API) getCodSettingsPublic(w http.ResponseWriter, r *http.Request) {
	s, err := a.Cat.GetCodSettings(r.Context())
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, s)
}

func (a *API) getCodSettingsAdmin(w http.ResponseWriter, r *http.Request) {
	s, err := a.Cat.GetCodSettings(r.Context())
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, s)
}

func (a *API) putCodSettingsAdmin(w http.ResponseWriter, r *http.Request) {
	var body catalog.CodSettings
	if err := Decode(r, &body); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	s, err := a.Cat.SaveCodSettings(r.Context(), body)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, s)
}

func (a *API) login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := Decode(r, &body); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	u, token, err := a.Auth.Authenticate(r.Context(), body.Email, body.Password)
	if err != nil {
		Error(w, http.StatusUnauthorized, "You have entered the email or password wrong.")
		return
	}
	JSON(w, http.StatusOK, map[string]any{
		"token": token,
		"user": map[string]any{
			"id": u.ID, "email": u.Email, "name": u.Name, "role": u.Role,
		},
	})
}

func (a *API) validateEmail(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
	}
	if err := DecodeLoose(r, &body); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	if a.Emails != nil {
		if msg := a.Emails.ValidateSignupEmail(email); msg != "" {
			JSON(w, http.StatusOK, map[string]any{"ok": false, "message": msg})
			return
		}
	}
	var exists bool
	_ = a.DB.QueryRowContext(r.Context(), `
		SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)`, email).Scan(&exists)
	if exists {
		JSON(w, http.StatusOK, map[string]any{
			"ok":      false,
			"message": "This email is already registered. Please log in instead.",
		})
		return
	}
	JSON(w, http.StatusOK, map[string]any{"ok": true, "message": "Email looks good"})
}

func (a *API) register(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email           string `json:"email"`
		Password        string `json:"password"`
		ConfirmPassword string `json:"confirmPassword"`
		Name            string `json:"name"`
		Gender          string `json:"gender"`
	}
	if err := Decode(r, &body); err != nil || body.Email == "" || body.Password == "" {
		Error(w, http.StatusBadRequest, "email and password required")
		return
	}
	name := strings.TrimSpace(body.Name)
	if name == "" {
		Error(w, http.StatusBadRequest, "name is required")
		return
	}
	gender := strings.ToLower(strings.TrimSpace(body.Gender))
	if gender != "male" && gender != "female" {
		Error(w, http.StatusBadRequest, "please select male or female")
		return
	}
	if len(body.Password) < 6 {
		Error(w, http.StatusBadRequest, "password must be at least 6 characters")
		return
	}
	if body.ConfirmPassword != "" && body.Password != body.ConfirmPassword {
		Error(w, http.StatusBadRequest, "passwords do not match")
		return
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	if a.Emails != nil {
		if msg := a.Emails.ValidateSignupEmail(email); msg != "" {
			Error(w, http.StatusBadRequest, msg)
			return
		}
	}
	var exists bool
	_ = a.DB.QueryRowContext(r.Context(), `
		SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)`, email).Scan(&exists)
	if exists {
		Error(w, http.StatusConflict, "This email is already registered. Please log in instead.")
		return
	}
	hash, err := a.Auth.HashPassword(body.Password)
	if err != nil {
		Error(w, http.StatusInternalServerError, "could not hash password")
		return
	}
	id := uuid.New()
	_, err = a.DB.ExecContext(r.Context(), `
		INSERT INTO users (id, email, password_hash, name, role, gender) VALUES ($1,$2,$3,$4,'customer',$5)`,
		id, email, hash, name, gender)
	if err != nil {
		Error(w, http.StatusConflict, "This email is already registered. Please log in instead.")
		return
	}
	u := &auth.User{ID: id, Email: email, Name: name, Gender: gender, Role: auth.RoleCustomer}
	token, err := a.Auth.IssueToken(u)
	if err != nil {
		Error(w, http.StatusInternalServerError, "token error")
		return
	}
	JSON(w, http.StatusCreated, map[string]any{
		"token": token,
		"user": map[string]any{
			"id": u.ID, "email": u.Email, "name": u.Name, "gender": u.Gender, "role": u.Role,
		},
	})
}

func (a *API) adminMe(w http.ResponseWriter, r *http.Request) {
	c := auth.UserFrom(r.Context())
	JSON(w, http.StatusOK, c)
}

func (a *API) adminDashboard(w http.ResponseWriter, r *http.Request) {
	days, _ := strconv.Atoi(r.URL.Query().Get("days"))
	stats, err := a.Cat.DashboardStats(r.Context(), days)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, stats)
}

func (a *API) listCategoriesPublic(w http.ResponseWriter, r *http.Request) {
	list, err := a.Cat.ListCategories(r.Context(), true)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, list)
}

func (a *API) listCategoriesAdmin(w http.ResponseWriter, r *http.Request) {
	list, err := a.Cat.ListCategories(r.Context(), false)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, list)
}

func (a *API) createCategory(w http.ResponseWriter, r *http.Request) {
	var c catalog.Category
	if err := Decode(r, &c); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	c.ID = uuid.Nil
	if err := a.Cat.UpsertCategory(r.Context(), &c); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusCreated, c)
}

func (a *API) updateCategory(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	var c catalog.Category
	if err := Decode(r, &c); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	c.ID = id
	if err := a.Cat.UpsertCategory(r.Context(), &c); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, c)
}

func (a *API) deleteCategory(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := a.Cat.DeleteCategory(r.Context(), id); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (a *API) getCategoryAdmin(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	c, err := a.Cat.GetCategory(r.Context(), id)
	if err != nil {
		Error(w, http.StatusNotFound, "category not found")
		return
	}
	JSON(w, http.StatusOK, c)
}

func (a *API) listCategoryProducts(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	list, err := a.Cat.ListProductsByCategoryID(r.Context(), id)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, list)
}

func (a *API) removeProductFromCategory(w http.ResponseWriter, r *http.Request) {
	catID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid category id")
		return
	}
	productID, err := uuid.Parse(chi.URLParam(r, "productId"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid product id")
		return
	}
	if err := a.Cat.RemoveProductFromCategory(r.Context(), catID, productID); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (a *API) moveProductCategory(w http.ResponseWriter, r *http.Request) {
	fromID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid category id")
		return
	}
	productID, err := uuid.Parse(chi.URLParam(r, "productId"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid product id")
		return
	}
	var body struct {
		CategoryID string `json:"categoryId"`
	}
	if err := Decode(r, &body); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	toID := uuid.Nil
	if strings.TrimSpace(body.CategoryID) != "" {
		parsed, err := uuid.Parse(body.CategoryID)
		if err != nil {
			Error(w, http.StatusBadRequest, "invalid target category")
			return
		}
		toID = parsed
	}
	if err := a.Cat.MoveProductCategory(r.Context(), productID, fromID, toID); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (a *API) listProductsPublic(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	page, err := a.Cat.ListProductsPage(r.Context(), catalog.ProductFilter{
		Tag: q.Get("tag"), Category: q.Get("category"), Query: q.Get("q"),
		Status: "", Limit: limit, Offset: offset,
	})
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, page)
}

func (a *API) listProductsAdmin(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))
	status := q.Get("status")
	if status == "" {
		status = "all"
	}
	page, err := a.Cat.ListProductsPage(r.Context(), catalog.ProductFilter{
		Tag: q.Get("tag"), Category: q.Get("category"), Query: q.Get("q"),
		Status: status, Limit: limit, Offset: offset,
	})
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	// Admin UIs historically expected a bare array — keep items at top of data
	// while also exposing total for pagination.
	JSON(w, http.StatusOK, map[string]any{
		"items": page.Items,
		"total": page.Total,
	})
}

func (a *API) getProductBySlug(w http.ResponseWriter, r *http.Request) {
	p, err := a.Cat.GetBySlug(r.Context(), chi.URLParam(r, "slug"))
	if err != nil {
		Error(w, http.StatusNotFound, "product not found")
		return
	}
	JSON(w, http.StatusOK, p)
}

func (a *API) getProductAdmin(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	p, err := a.Cat.GetByID(r.Context(), id)
	if err != nil {
		Error(w, http.StatusNotFound, "product not found")
		return
	}
	JSON(w, http.StatusOK, p)
}

func (a *API) createProduct(w http.ResponseWriter, r *http.Request) {
	var in catalog.ProductInput
	if err := DecodeLoose(r, &in); err != nil {
		Error(w, http.StatusBadRequest, "could not read product: "+err.Error())
		return
	}
	p, err := a.Cat.SaveProduct(r.Context(), uuid.Nil, in)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusCreated, p)
}

func (a *API) updateProduct(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	var in catalog.ProductInput
	if err := DecodeLoose(r, &in); err != nil {
		Error(w, http.StatusBadRequest, "could not read product: "+err.Error())
		return
	}
	p, err := a.Cat.SaveProduct(r.Context(), id, in)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, p)
}

func (a *API) deleteProduct(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := a.Cat.DeleteProduct(r.Context(), id); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (a *API) listTags(w http.ResponseWriter, r *http.Request) {
	list, err := a.Cat.ListTags(r.Context())
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, list)
}

func (a *API) createTag(w http.ResponseWriter, r *http.Request) {
	var t catalog.Tag
	if err := Decode(r, &t); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	t.ID = uuid.Nil
	if err := a.Cat.UpsertTag(r.Context(), &t); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusCreated, t)
}

func (a *API) updateTag(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	var t catalog.Tag
	if err := Decode(r, &t); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	t.ID = id
	if err := a.Cat.UpsertTag(r.Context(), &t); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, t)
}

func (a *API) deleteTag(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := a.Cat.DeleteTag(r.Context(), id); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (a *API) listDetailFields(w http.ResponseWriter, r *http.Request) {
	list, err := a.Cat.ListDetailFields(r.Context())
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, list)
}

func (a *API) createDetailField(w http.ResponseWriter, r *http.Request) {
	var f catalog.DetailField
	if err := Decode(r, &f); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	f.ID = uuid.Nil
	if err := a.Cat.UpsertDetailField(r.Context(), &f); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusCreated, f)
}

func (a *API) updateDetailField(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	var f catalog.DetailField
	if err := Decode(r, &f); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	f.ID = id
	if err := a.Cat.UpsertDetailField(r.Context(), &f); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, f)
}

func (a *API) deleteDetailField(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := a.Cat.DeleteDetailField(r.Context(), id); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (a *API) listSlots(w http.ResponseWriter, r *http.Request) {
	list, err := a.Mkt.ListSlots(r.Context())
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, list)
}

func (a *API) listBannersPublic(w http.ResponseWriter, r *http.Request) {
	list, err := a.Mkt.ListBanners(r.Context(), r.URL.Query().Get("slot"), true)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, list)
}

func (a *API) listBannersAdmin(w http.ResponseWriter, r *http.Request) {
	list, err := a.Mkt.ListBanners(r.Context(), r.URL.Query().Get("slot"), false)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, list)
}

func (a *API) createBanner(w http.ResponseWriter, r *http.Request) {
	var b marketing.Banner
	if err := Decode(r, &b); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	b.ID = uuid.Nil
	if err := a.Mkt.SaveBanner(r.Context(), &b); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusCreated, b)
}

func (a *API) updateBanner(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	var b marketing.Banner
	if err := Decode(r, &b); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	b.ID = id
	if err := a.Mkt.SaveBanner(r.Context(), &b); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, b)
}

func (a *API) deleteBanner(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := a.Mkt.DeleteBanner(r.Context(), id); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func shopperGeoFromRequest(r *http.Request) (countryIso, countryName, stateName string) {
	q := r.URL.Query()
	countryIso = strings.TrimSpace(q.Get("country"))
	countryName = strings.TrimSpace(q.Get("countryName"))
	stateName = strings.TrimSpace(q.Get("state"))
	return countryIso, countryName, stateName
}

func (a *API) listActiveDeals(w http.ResponseWriter, r *http.Request) {
	countryIso, countryName, stateName := shopperGeoFromRequest(r)
	list, err := a.Mkt.ListActiveDeals(r.Context(), countryIso, countryName, stateName)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, list)
}

func (a *API) getDealBanner(w http.ResponseWriter, r *http.Request) {
	countryIso, countryName, stateName := shopperGeoFromRequest(r)
	d, err := a.Mkt.GetDealBanner(r.Context(), countryIso, countryName, stateName)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	if d == nil {
		JSON(w, http.StatusOK, nil)
		return
	}
	JSON(w, http.StatusOK, d)
}

func (a *API) listDealsAdmin(w http.ResponseWriter, r *http.Request) {
	list, err := a.Mkt.ListDeals(r.Context())
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, list)
}

func (a *API) createDeal(w http.ResponseWriter, r *http.Request) {
	var d marketing.Deal
	if err := Decode(r, &d); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	d.ID = uuid.Nil
	if err := a.Mkt.SaveDeal(r.Context(), &d); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusCreated, d)
}

func (a *API) updateDeal(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	var d marketing.Deal
	if err := Decode(r, &d); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	d.ID = id
	if err := a.Mkt.SaveDeal(r.Context(), &d); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, d)
}

func (a *API) deleteDeal(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := a.Mkt.DeleteDeal(r.Context(), id); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (a *API) listPromotionsAdmin(w http.ResponseWriter, r *http.Request) {
	list, err := a.Mkt.ListPromotions(r.Context(), false)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, list)
}

func (a *API) listActivePromotions(w http.ResponseWriter, r *http.Request) {
	var userID *uuid.UUID
	if c := auth.UserFrom(r.Context()); c != nil {
		userID = &c.UserID
	}
	list, err := a.Mkt.ListActiveOffersPublic(r.Context(), userID)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, list)
}

func (a *API) createPromotion(w http.ResponseWriter, r *http.Request) {
	var p marketing.Promotion
	if err := DecodeLoose(r, &p); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	p.ID = uuid.Nil
	if err := a.Mkt.UpsertPromotion(r.Context(), &p); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusCreated, p)
}

func (a *API) updatePromotion(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	var p marketing.Promotion
	if err := DecodeLoose(r, &p); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	p.ID = id
	if err := a.Mkt.UpsertPromotion(r.Context(), &p); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, p)
}

func (a *API) deletePromotion(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := a.Mkt.DeletePromotion(r.Context(), id); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (a *API) validatePromotion(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Code          string                `json:"code"`
		Subtotal      float64               `json:"subtotal"`
		ProductIDs    []uuid.UUID           `json:"productIds"`
		ProductTotals map[uuid.UUID]float64 `json:"productTotals"`
	}
	if err := DecodeLoose(r, &body); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	var userID *uuid.UUID
	if c := auth.UserFrom(r.Context()); c != nil {
		userID = &c.UserID
	}
	res, err := a.Mkt.QuotePromotion(r.Context(), marketing.PromoQuoteInput{
		Code:          body.Code,
		Subtotal:      body.Subtotal,
		ProductIDs:    body.ProductIDs,
		ProductTotals: body.ProductTotals,
		UserID:        userID,
	})
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if res == nil || !res.OK {
		msg := "invalid promo code"
		if res != nil && res.Message != "" {
			msg = res.Message
		}
		Error(w, http.StatusBadRequest, msg)
		return
	}
	JSON(w, http.StatusOK, res)
}

func (a *API) listProductPromotions(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	p, err := a.Cat.GetBySlug(r.Context(), slug)
	if err != nil {
		Error(w, http.StatusNotFound, "product not found")
		return
	}
	var userID *uuid.UUID
	if c := auth.UserFrom(r.Context()); c != nil {
		userID = &c.UserID
	}
	list, err := a.Mkt.ListProductPromotions(r.Context(), p.ID, userID)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, list)
}

func (a *API) listInventory(w http.ResponseWriter, r *http.Request) {
	list, err := a.Cat.ListInventory(r.Context())
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, list)
}

func (a *API) adjustInventory(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	var in catalog.InventoryAdjust
	if err := Decode(r, &in); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	v, err := a.Cat.AdjustInventory(r.Context(), id, in)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, v)
}

func cacheUploads(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Uploaded assets are content-addressed by unique filenames — safe to cache hard.
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		next.ServeHTTP(w, r)
	})
}

func noStoreJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Prices, stock, deals must never be served stale from a browser/proxy cache.
		w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
		w.Header().Set("Pragma", "no-cache")
		next.ServeHTTP(w, r)
	})
}

func (a *API) quoteOrder(w http.ResponseWriter, r *http.Request) {
	var in catalog.OrderInput
	if err := Decode(r, &in); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	var userID *uuid.UUID
	if c := auth.UserFrom(r.Context()); c != nil {
		userID = &c.UserID
	}
	quote, err := a.Cat.QuoteOrder(r.Context(), userID, in)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, quote)
}

func (a *API) createOrder(w http.ResponseWriter, r *http.Request) {
	var in catalog.OrderInput
	if err := Decode(r, &in); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	c := auth.UserFrom(r.Context())
	if c == nil {
		Error(w, http.StatusUnauthorized, "login required")
		return
	}
	userID := c.UserID
	order, err := a.Cat.CreateOrder(r.Context(), &userID, in)
	if err != nil {
		var mismatch *catalog.PriceMismatchError
		if errors.As(err, &mismatch) {
			ErrorWithData(w, http.StatusConflict, mismatch.Error(), mismatch)
			return
		}
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusCreated, order)
}

func (a *API) customerMe(w http.ResponseWriter, r *http.Request) {
	c := auth.UserFrom(r.Context())
	if c == nil {
		Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	u, err := a.Auth.FindByID(r.Context(), c.UserID)
	if err != nil {
		Error(w, http.StatusNotFound, "user not found")
		return
	}
	var address any
	_ = json.Unmarshal(u.AddressJSON, &address)
	var measurements any
	if len(u.MeasurementsJSON) > 0 {
		_ = json.Unmarshal(u.MeasurementsJSON, &measurements)
	}
	if measurements == nil {
		measurements = []any{}
	}
	JSON(w, http.StatusOK, map[string]any{
		"id": u.ID, "email": u.Email, "name": u.Name, "phone": u.Phone,
		"avatarUrl": u.AvatarURL, "gender": u.Gender, "address": address,
		"measurementSets": measurements, "role": u.Role,
	})
}

func (a *API) updateCustomerMe(w http.ResponseWriter, r *http.Request) {
	c := auth.UserFrom(r.Context())
	if c == nil {
		Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var body struct {
		Name            string           `json:"name"`
		Phone           string           `json:"phone"`
		AvatarURL       string           `json:"avatarUrl"`
		Gender          *string          `json:"gender"`
		Address         json.RawMessage  `json:"address"`
		MeasurementSets *json.RawMessage `json:"measurementSets"`
	}
	if err := Decode(r, &body); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	var meas json.RawMessage
	if body.MeasurementSets != nil {
		meas = *body.MeasurementSets
	}
	var gender *string
	if body.Gender != nil {
		g := strings.ToLower(strings.TrimSpace(*body.Gender))
		if g != "" && g != "male" && g != "female" {
			Error(w, http.StatusBadRequest, "gender must be male or female")
			return
		}
		gender = &g
	}
	if err := a.Cat.UpdateCustomerProfile(r.Context(), c.UserID, body.Name, body.Phone, body.AvatarURL, body.Address, meas, gender); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	a.customerMe(w, r)
}

func parseDayBound(raw string, endOfDay bool) *time.Time {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	if t, err := time.Parse(time.RFC3339, raw); err == nil {
		return &t
	}
	if t, err := time.ParseInLocation("2006-01-02", raw, time.Local); err == nil {
		if endOfDay {
			t = t.Add(24 * time.Hour)
		}
		return &t
	}
	return nil
}

func (a *API) orderFilterFromRequest(r *http.Request) catalog.OrderListFilter {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	return catalog.OrderListFilter{
		Status:        r.URL.Query().Get("status"),
		PaymentMethod: r.URL.Query().Get("payment"),
		From:          parseDayBound(r.URL.Query().Get("from"), false),
		To:            parseDayBound(r.URL.Query().Get("to"), true),
		Limit:         limit,
		Offset:        offset,
		IncludeItems:  false,
	}
}

func (a *API) listOrdersAdmin(w http.ResponseWriter, r *http.Request) {
	f := a.orderFilterFromRequest(r)
	list, total, facets, err := a.Cat.ListOrdersFiltered(r.Context(), f)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]any{"items": list, "total": total, "facets": facets})
}

func (a *API) listOrdersCustomer(w http.ResponseWriter, r *http.Request) {
	c := auth.UserFrom(r.Context())
	if c == nil {
		Error(w, http.StatusUnauthorized, "login required")
		return
	}
	f := a.orderFilterFromRequest(r)
	uid := c.UserID
	f.UserID = &uid
	f.IncludeItems = true
	list, total, _, err := a.Cat.ListOrdersFiltered(r.Context(), f)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]any{"items": list, "total": total})
}

func (a *API) getOrderCustomer(w http.ResponseWriter, r *http.Request) {
	c := auth.UserFrom(r.Context())
	if c == nil {
		Error(w, http.StatusUnauthorized, "login required")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	o, err := a.Cat.GetOrder(r.Context(), id)
	if err != nil || o.UserID == nil || *o.UserID != c.UserID {
		Error(w, http.StatusNotFound, "order not found")
		return
	}
	JSON(w, http.StatusOK, o)
}

func (a *API) cancelOrderCustomer(w http.ResponseWriter, r *http.Request) {
	c := auth.UserFrom(r.Context())
	if c == nil {
		Error(w, http.StatusUnauthorized, "login required")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	o, err := a.Cat.CancelOrderByCustomer(r.Context(), id, c.UserID)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, o)
}

func (a *API) openSupportTicket(w http.ResponseWriter, r *http.Request) {
	c := auth.UserFrom(r.Context())
	if c == nil {
		Error(w, http.StatusUnauthorized, "login required")
		return
	}
	var body struct {
		OrderID string `json:"orderId"`
	}
	if err := DecodeLoose(r, &body); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	orderID, err := uuid.Parse(body.OrderID)
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid order")
		return
	}
	t, err := a.Cat.OpenSupportTicket(r.Context(), c.UserID, orderID)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, t)
}

func (a *API) listSupportTickets(w http.ResponseWriter, r *http.Request) {
	c := auth.UserFrom(r.Context())
	if c == nil {
		Error(w, http.StatusUnauthorized, "login required")
		return
	}
	list, err := a.Cat.ListSupportTickets(r.Context(), c.UserID)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]any{"items": list})
}

func (a *API) getSupportTicket(w http.ResponseWriter, r *http.Request) {
	c := auth.UserFrom(r.Context())
	if c == nil {
		Error(w, http.StatusUnauthorized, "login required")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	t, err := a.Cat.GetSupportTicket(r.Context(), id, c.UserID)
	if err != nil {
		Error(w, http.StatusNotFound, err.Error())
		return
	}
	JSON(w, http.StatusOK, t)
}

func (a *API) reopenSupportTicket(w http.ResponseWriter, r *http.Request) {
	c := auth.UserFrom(r.Context())
	if c == nil {
		Error(w, http.StatusUnauthorized, "login required")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	t, err := a.Cat.ReopenSupportTicket(r.Context(), id, c.UserID)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, t)
}

func (a *API) postSupportMessage(w http.ResponseWriter, r *http.Request) {
	c := auth.UserFrom(r.Context())
	if c == nil {
		Error(w, http.StatusUnauthorized, "login required")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	var body struct {
		Body string `json:"body"`
	}
	if err := DecodeLoose(r, &body); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	t, err := a.Cat.PostSupportMessage(r.Context(), id, c.UserID, body.Body)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, t)
}

func (a *API) listNotifications(w http.ResponseWriter, r *http.Request) {
	c := auth.UserFrom(r.Context())
	if c == nil {
		Error(w, http.StatusUnauthorized, "login required")
		return
	}
	list, unread, err := a.Cat.ListNotifications(r.Context(), c.UserID)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]any{"items": list, "unread": unread})
}

func (a *API) readNotification(w http.ResponseWriter, r *http.Request) {
	c := auth.UserFrom(r.Context())
	if c == nil {
		Error(w, http.StatusUnauthorized, "login required")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := a.Cat.MarkNotificationRead(r.Context(), id, c.UserID); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (a *API) adminInbox(w http.ResponseWriter, r *http.Request) {
	inbox, err := a.Cat.AdminInbox(r.Context())
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, inbox)
}

func (a *API) listSupportTicketsAdmin(w http.ResponseWriter, r *http.Request) {
	list, err := a.Cat.ListSupportTicketsAdmin(r.Context())
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]any{"items": list})
}

func (a *API) getSupportTicketAdmin(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	t, err := a.Cat.GetSupportTicketAdmin(r.Context(), id)
	if err != nil {
		Error(w, http.StatusNotFound, err.Error())
		return
	}
	JSON(w, http.StatusOK, t)
}

func (a *API) postSupportReply(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	var body struct {
		Body string `json:"body"`
	}
	if err := DecodeLoose(r, &body); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	t, err := a.Cat.PostSupportReply(r.Context(), id, body.Body)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, t)
}

func (a *API) resolveSupportTicket(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	t, err := a.Cat.ResolveSupportTicket(r.Context(), id)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, t)
}

func (a *API) readSupportTicketAdmin(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	t, err := a.Cat.MarkSupportTicketReadAdmin(r.Context(), id)
	if err != nil {
		Error(w, http.StatusNotFound, err.Error())
		return
	}
	JSON(w, http.StatusOK, t)
}

func (a *API) readSupportTicketCustomer(w http.ResponseWriter, r *http.Request) {
	c := auth.UserFrom(r.Context())
	if c == nil {
		Error(w, http.StatusUnauthorized, "login required")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	if _, err := a.Cat.GetSupportTicket(r.Context(), id, c.UserID); err != nil {
		Error(w, http.StatusNotFound, err.Error())
		return
	}
	if err := a.Cat.MarkTicketNotificationsRead(r.Context(), c.UserID, id); err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (a *API) getOrderAdmin(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	o, err := a.Cat.GetOrder(r.Context(), id)
	if err != nil {
		Error(w, http.StatusNotFound, "order not found")
		return
	}
	JSON(w, http.StatusOK, o)
}

func (a *API) orderActionAdmin(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	var body struct {
		Action string `json:"action"`
		Note   string `json:"note"`
	}
	if err := Decode(r, &body); err != nil || body.Action == "" {
		Error(w, http.StatusBadRequest, "action required")
		return
	}
	o, err := a.Cat.UpdateOrderAction(r.Context(), id, body.Action, body.Note)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, o)
}

func (a *API) cancelOrderFromQueryAdmin(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	var body catalog.CancelFromQueryInput
	if err := Decode(r, &body); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	o, err := a.Cat.CancelOrderFromQuery(r.Context(), id, body)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, o)
}

func (a *API) updateOrderItemMeasurementsAdmin(w http.ResponseWriter, r *http.Request) {
	orderID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid order id")
		return
	}
	itemID, err := uuid.Parse(chi.URLParam(r, "itemId"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid item id")
		return
	}
	var body catalog.UpdateItemMeasurementsInput
	if err := Decode(r, &body); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	o, err := a.Cat.UpdateOrderItemMeasurements(r.Context(), orderID, itemID, body)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, o)
}

func (a *API) updateOrderShippingAdmin(w http.ResponseWriter, r *http.Request) {
	orderID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid order id")
		return
	}
	var body catalog.UpdateOrderShippingInput
	if err := Decode(r, &body); err != nil {
		Error(w, http.StatusBadRequest, "invalid body")
		return
	}
	o, err := a.Cat.UpdateOrderShipping(r.Context(), orderID, body)
	if err != nil {
		Error(w, http.StatusBadRequest, err.Error())
		return
	}
	JSON(w, http.StatusOK, o)
}

func (a *API) listUsersAdmin(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	list, total, err := a.Cat.ListCustomers(r.Context(), limit, offset)
	if err != nil {
		Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSON(w, http.StatusOK, map[string]any{"items": list, "total": total})
}

func (a *API) getUserAdmin(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	u, err := a.Auth.FindByID(r.Context(), id)
	if err != nil {
		Error(w, http.StatusNotFound, "user not found")
		return
	}
	var address any
	_ = json.Unmarshal(u.AddressJSON, &address)
	userOrders, _, _, _ := a.Cat.ListOrdersFiltered(r.Context(), catalog.OrderListFilter{
		UserID: &id, Limit: 50, Offset: 0, IncludeItems: false,
	})
	JSON(w, http.StatusOK, map[string]any{
		"id": u.ID, "email": u.Email, "name": u.Name, "phone": u.Phone,
		"avatarUrl": u.AvatarURL, "address": address, "role": u.Role,
		"createdAt": u.CreatedAt, "orders": userOrders,
	})
}

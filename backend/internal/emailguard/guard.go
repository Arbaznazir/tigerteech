package emailguard

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"net/http"
	"net/mail"
	"strings"
	"sync"
	"time"
)

// Guard validates signup emails: format, uniqueness is handled by DB,
// disposable/temp domains are blocked using a refreshed public blocklist
// plus a local seed. Major freemail providers are always allowed.
type Guard struct {
	mu        sync.RWMutex
	blocked   map[string]struct{}
	fetchedAt time.Time
	client    *http.Client
}

const blocklistURL = "https://raw.githubusercontent.com/disposable/disposable-email-domains/master/domains.txt"

// Trusted freemail / major consumer domains — never treat as disposable.
var trustedDomains = map[string]struct{}{
	"gmail.com": {}, "googlemail.com": {},
	"yahoo.com": {}, "yahoo.co.in": {}, "yahoo.co.uk": {}, "yahoo.fr": {},
	"yahoo.de": {}, "yahoo.ca": {}, "yahoo.com.au": {}, "ymail.com": {}, "rocketmail.com": {},
	"outlook.com": {}, "hotmail.com": {}, "hotmail.co.uk": {}, "hotmail.fr": {},
	"live.com": {}, "msn.com": {}, "passport.com": {},
	"icloud.com": {}, "me.com": {}, "mac.com": {},
	"aol.com": {}, "aim.com": {},
	"proton.me": {}, "protonmail.com": {}, "pm.me": {},
	"zoho.com": {}, "zohomail.com": {},
	"gmx.com": {}, "gmx.net": {}, "gmx.de": {},
	"mail.com": {}, "email.com": {},
	"rediffmail.com": {},
	"yandex.com": {}, "yandex.ru": {},
	"mail.ru": {}, "inbox.ru": {}, "bk.ru": {}, "list.ru": {},
	"fastmail.com": {}, "fastmail.fm": {},
	"tutanota.com": {}, "tuta.io": {},
	"hey.com": {},
	"comcast.net": {}, "verizon.net": {}, "att.net": {}, "sbcglobal.net": {},
	"btinternet.com": {}, "sky.com": {},
	"web.de": {}, "freenet.de": {}, "t-online.de": {},
	"qq.com": {}, "163.com": {}, "126.com": {}, "sina.com": {},
	"naver.com": {}, "daum.net": {},
}

// Seed of well-known throwaway / temp-mail domains (used before first refresh).
var seedBlocked = []string{
	"mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org",
	"10minutemail.com", "10minutemail.net", "tempmail.com", "temp-mail.org",
	"temp-mail.io", "tmpmail.org", "tmpmail.net", "throwawaymail.com",
	"yopmail.com", "yopmail.fr", "sharklasers.com", "grr.la", "guerrillamailblock.com",
	"trashmail.com", "trashmail.me", "trashmail.net", "discard.email", "discardmail.com",
	"mailnesia.com", "maildrop.cc", "getnada.com", "nada.email", "emailondeck.com",
	"fakeinbox.com", "tempail.com", "tempr.email", "dispostable.com", "mailcatch.com",
	"mintemail.com", "mytemp.email", "tempinbox.com", "moakt.com", "spamgourmet.com",
	"mailnull.com", "spam4.me", "mailforspam.com", "trash-mail.com", "wegwerfmail.de",
	"jetable.org", "kasmail.com", "spamfree24.org", "getairmail.com", "mohmal.com",
	"emailtemporanea.com", "tempmailo.com", "temporary-mail.net", "burnermail.io",
	"mailtemp.net", "tmpeml.com", "1secmail.com", "1secmail.org", "1secmail.net",
	"dropmail.me", "inboxkitten.com", "mailpoof.com", "tempmail.dev", "throwam.com",
}

func New() *Guard {
	g := &Guard{
		blocked: make(map[string]struct{}, len(seedBlocked)+64),
		client: &http.Client{
			Timeout: 25 * time.Second,
		},
	}
	for _, d := range seedBlocked {
		g.blocked[strings.ToLower(d)] = struct{}{}
	}
	return g
}

// StartRefresh loads the public blocklist and refreshes on an interval.
func (g *Guard) StartRefresh(ctx context.Context) {
	go func() {
		_ = g.Refresh(ctx)
		t := time.NewTicker(12 * time.Hour)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				if err := g.Refresh(ctx); err != nil {
					log.Printf("emailguard: refresh failed: %v", err)
				}
			}
		}
	}()
}

func (g *Guard) Refresh(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, blocklistURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "TigerteehEmailGuard/1.0")
	res, err := g.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("blocklist HTTP %d", res.StatusCode)
	}

	next := make(map[string]struct{}, 120000)
	for _, d := range seedBlocked {
		next[strings.ToLower(d)] = struct{}{}
	}
	sc := bufio.NewScanner(res.Body)
	// domains.txt can be large
	buf := make([]byte, 0, 64*1024)
	sc.Buffer(buf, 1024*1024)
	count := 0
	for sc.Scan() {
		line := strings.ToLower(strings.TrimSpace(sc.Text()))
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		next[line] = struct{}{}
		count++
	}
	if err := sc.Err(); err != nil {
		return err
	}
	if count < 1000 {
		return fmt.Errorf("blocklist too small (%d lines)", count)
	}

	g.mu.Lock()
	g.blocked = next
	g.fetchedAt = time.Now()
	g.mu.Unlock()
	log.Printf("emailguard: loaded %d disposable domains", count)
	return nil
}

// ValidateSignupEmail returns a user-facing error string, or "" if OK.
func (g *Guard) ValidateSignupEmail(raw string) string {
	email := strings.TrimSpace(strings.ToLower(raw))
	if email == "" {
		return "Email is required"
	}
	if len(email) > 254 {
		return "Email is too long"
	}
	addr, err := mail.ParseAddress(email)
	if err != nil || addr.Address == "" {
		return "Enter a valid email address"
	}
	email = strings.ToLower(addr.Address)
	at := strings.LastIndex(email, "@")
	if at < 1 || at == len(email)-1 {
		return "Enter a valid email address"
	}
	local := email[:at]
	domain := email[at+1:]
	if local == "" || domain == "" || !strings.Contains(domain, ".") {
		return "Enter a valid email address"
	}
	if strings.ContainsAny(local, " ") || strings.ContainsAny(domain, " ") {
		return "Enter a valid email address"
	}

	if isTrusted(domain) {
		return ""
	}
	if g.isBlocked(domain) {
		return "Temporary or disposable email addresses are not allowed. Use Gmail, Yahoo, Outlook, or another permanent email."
	}
	return ""
}

func isTrusted(domain string) bool {
	domain = strings.ToLower(strings.TrimSpace(domain))
	if _, ok := trustedDomains[domain]; ok {
		return true
	}
	// yahoo.co.*, outlook.*, hotmail.* country variants
	if strings.HasPrefix(domain, "yahoo.") ||
		strings.HasPrefix(domain, "ymail.") ||
		strings.HasPrefix(domain, "hotmail.") ||
		strings.HasPrefix(domain, "outlook.") ||
		strings.HasPrefix(domain, "live.") {
		return true
	}
	return false
}

func (g *Guard) isBlocked(domain string) bool {
	domain = strings.ToLower(strings.TrimSpace(domain))
	g.mu.RLock()
	defer g.mu.RUnlock()
	if _, ok := g.blocked[domain]; ok {
		return true
	}
	// Match parent domains: a.b.tempmail.com → tempmail.com
	parts := strings.Split(domain, ".")
	for i := 1; i < len(parts)-1; i++ {
		parent := strings.Join(parts[i:], ".")
		if _, ok := g.blocked[parent]; ok {
			return true
		}
	}
	return false
}

func (g *Guard) Stats() (count int, fetchedAt time.Time) {
	g.mu.RLock()
	defer g.mu.RUnlock()
	return len(g.blocked), g.fetchedAt
}

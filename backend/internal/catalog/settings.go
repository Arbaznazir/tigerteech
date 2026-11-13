package catalog

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
)

type CodRule struct {
	CountryIso  string   `json:"countryIso"`
	CountryName string   `json:"countryName"`
	Scope       string   `json:"scope"` // country | states
	States      []string `json:"states"`
	StateIsos   []string `json:"stateIsos,omitempty"`
}

type CodSettings struct {
	Enabled    bool      `json:"enabled"`
	Everywhere bool      `json:"everywhere"`
	Rules      []CodRule `json:"rules"`
}

func defaultCodSettings() CodSettings {
	return CodSettings{
		Enabled:    true,
		Everywhere: true,
		Rules:      []CodRule{},
	}
}

func (s *Store) GetCodSettings(ctx context.Context) (CodSettings, error) {
	var raw []byte
	err := s.DB.QueryRowContext(ctx, `
		SELECT value_json FROM platform_settings WHERE key='cod'`).Scan(&raw)
	if err != nil {
		if err == sql.ErrNoRows {
			return defaultCodSettings(), nil
		}
		return CodSettings{}, err
	}
	out := defaultCodSettings()
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &out)
	}
	if out.Rules == nil {
		out.Rules = []CodRule{}
	}
	return out, nil
}

func (s *Store) SaveCodSettings(ctx context.Context, in CodSettings) (CodSettings, error) {
	if in.Rules == nil {
		in.Rules = []CodRule{}
	}
	cleaned := make([]CodRule, 0, len(in.Rules))
	for _, r := range in.Rules {
		r.CountryIso = strings.ToUpper(strings.TrimSpace(r.CountryIso))
		r.CountryName = strings.TrimSpace(r.CountryName)
		r.Scope = strings.ToLower(strings.TrimSpace(r.Scope))
		if r.Scope != "states" {
			r.Scope = "country"
			r.States = []string{}
			r.StateIsos = []string{}
		} else {
			states := make([]string, 0, len(r.States))
			for _, st := range r.States {
				st = strings.TrimSpace(st)
				if st != "" {
					states = append(states, st)
				}
			}
			r.States = states
			isos := make([]string, 0, len(r.StateIsos))
			for _, iso := range r.StateIsos {
				iso = strings.ToUpper(strings.TrimSpace(iso))
				if iso != "" {
					isos = append(isos, iso)
				}
			}
			r.StateIsos = isos
		}
		if r.CountryIso == "" && r.CountryName == "" {
			continue
		}
		cleaned = append(cleaned, r)
	}
	in.Rules = cleaned
	if in.Everywhere {
		// Everywhere ignores per-region rules for matching, but we keep them for editing.
	}
	raw, err := json.Marshal(in)
	if err != nil {
		return CodSettings{}, err
	}
	_, err = s.DB.ExecContext(ctx, `
		INSERT INTO platform_settings (key, value_json, updated_at)
		VALUES ('cod', $1, NOW())
		ON CONFLICT (key) DO UPDATE
		SET value_json=EXCLUDED.value_json, updated_at=NOW()`, raw)
	if err != nil {
		return CodSettings{}, err
	}
	return in, nil
}

func normLoc(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}

// CodAllowedForAddress reports whether COD can be offered for this ship-to.
func CodAllowedForAddress(settings CodSettings, country, state string) bool {
	if !settings.Enabled {
		return false
	}
	if settings.Everywhere {
		return true
	}
	if len(settings.Rules) == 0 {
		return false
	}
	c := normLoc(country)
	st := normLoc(state)
	if c == "" {
		return false
	}
	for _, rule := range settings.Rules {
		matchCountry := false
		if iso := normLoc(rule.CountryIso); iso != "" && (c == iso || strings.EqualFold(country, rule.CountryIso)) {
			matchCountry = true
		}
		if name := normLoc(rule.CountryName); name != "" && (c == name || strings.Contains(c, name) || strings.Contains(name, c)) {
			matchCountry = true
		}
		if !matchCountry {
			continue
		}
		if rule.Scope != "states" {
			return true
		}
		for _, allowed := range rule.States {
			a := normLoc(allowed)
			if a != "" && (st == a || strings.Contains(st, a) || strings.Contains(a, st)) {
				return true
			}
		}
		for _, iso := range rule.StateIsos {
			if st != "" && strings.EqualFold(st, iso) {
				return true
			}
		}
	}
	return false
}

func shippingCountryState(raw json.RawMessage) (country, state string) {
	if len(raw) == 0 {
		return "", ""
	}
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		return "", ""
	}
	if v, ok := m["country"]; ok && v != nil {
		country = strings.TrimSpace(fmt.Sprint(v))
	}
	if v, ok := m["state"]; ok && v != nil {
		state = strings.TrimSpace(fmt.Sprint(v))
	}
	return country, state
}

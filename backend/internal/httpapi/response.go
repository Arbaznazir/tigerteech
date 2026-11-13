package httpapi

import (
	"encoding/json"
	"net/http"
)

type envelope struct {
	Data  any    `json:"data"`
	Error *string `json:"error"`
}

func JSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	// Ensure nil slices encode as [] not null for frontend consumers.
	if data == nil {
		data = []any{}
	}
	enc := json.NewEncoder(w)
	_ = enc.Encode(envelope{Data: data, Error: nil})
}

func Error(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(envelope{Data: nil, Error: &msg})
}

func ErrorWithData(w http.ResponseWriter, status int, msg string, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(envelope{Data: data, Error: &msg})
}

func Decode(r *http.Request, dst any) error {
	defer r.Body.Close()
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
}

// DecodeLoose accepts forward-compatible payloads (extra client fields ignored).
func DecodeLoose(r *http.Request, dst any) error {
	defer r.Body.Close()
	dec := json.NewDecoder(r.Body)
	return dec.Decode(dst)
}

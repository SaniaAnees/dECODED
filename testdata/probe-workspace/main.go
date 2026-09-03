package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

// Shop is a tiny PAYG snack cart API. Auth, cart, and checkout are missing on purpose.
func main() {
	s := NewStore()
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"ok": "true"})
	})
	mux.HandleFunc("GET /items", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, s.List())
	})
	mux.HandleFunc("GET /items/", func(w http.ResponseWriter, r *http.Request) {
		sku := strings.TrimPrefix(r.URL.Path, "/items/")
		it, ok := s.Get(sku)
		if !ok {
			http.Error(w, `{"error":"not found"}`, http.StatusNotFound)
			return
		}
		writeJSON(w, http.StatusOK, it)
	})
	mux.HandleFunc("POST /items", func(w http.ResponseWriter, r *http.Request) {
		var it Item
		if err := json.NewDecoder(r.Body).Decode(&it); err != nil {
			http.Error(w, `{"error":"bad json"}`, http.StatusBadRequest)
			return
		}
		if err := s.Create(it); err != nil {
			http.Error(w, `{"error":"`+err.Error()+`"}`, http.StatusNotImplemented)
			return
		}
		writeJSON(w, http.StatusCreated, it)
	})
	log.Println("shop listening on :7090")
	log.Fatal(http.ListenAndServe("127.0.0.1:7090", mux))
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

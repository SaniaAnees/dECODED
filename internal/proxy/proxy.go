// Package proxy is the PAYG localhost hop: agent → Detect → Normalize → upstream.
package proxy

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/SaniaAnees/dECODED/internal/stats"
)

const DefaultAddr = "127.0.0.1:8080"

// maxBody is the POST cap (32 MiB). Tests may lower it.
var maxBody = 32 << 20

// Hooks so tests can stub Detect / Normalize / UpstreamURL.
var (
	detect      = defaultDetect
	normalize   = defaultNormalize
	upstreamURL = defaultUpstreamURL
)

// Server is the localhost reverse proxy. Handler() is used in tests;
// Start binds loopback only.
type Server struct {
	client *http.Client
	sticky string
	Stats  *stats.Store
	log    *log.Logger
}

func New() *Server {
	return &Server{
		client: &http.Client{
			Transport: &http.Transport{
				ResponseHeaderTimeout: 120 * time.Second,
			},
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 10 {
					return fmt.Errorf("proxy: too many redirects")
				}
				if len(via) > 0 {
					if a := via[0].Header.Get("Authorization"); a != "" && req.Header.Get("Authorization") == "" {
						req.Header.Set("Authorization", a)
					}
				}
				return nil
			},
		},
		sticky: newStickyKey(),
		Stats:  stats.New(),
		log:    log.Default(),
	}
}

func newStickyKey() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "decoded-local"
	}
	return hex.EncodeToString(b[:])
}

// Start listens on addr (default 127.0.0.1:8080). Refuses non-loopback binds.
func Start(addr string) error {
	if strings.TrimSpace(addr) == "" {
		addr = DefaultAddr
	}
	if err := checkLoopback(addr); err != nil {
		return err
	}
	s := New()
	srv := &http.Server{
		Addr:              addr,
		Handler:           s.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}
	log.Printf("decoded listening on http://%s", addr)
	return srv.Serve(ln)
}

func checkLoopback(addr string) error {
	host, port, err := net.SplitHostPort(addr)
	if err != nil {
		return fmt.Errorf("proxy: invalid listen addr")
	}
	if port == "" {
		return fmt.Errorf("proxy: listen addr missing port")
	}
	if strings.EqualFold(host, "localhost") {
		return nil
	}
	ip := net.ParseIP(host)
	if ip == nil || !ip.IsLoopback() {
		return fmt.Errorf("proxy: must listen on loopback (127.0.0.1), not %s", host)
	}
	return nil
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", s.handleHealth)
	mux.HandleFunc("GET /stats", s.handleStats)
	mux.HandleFunc("POST /v1/chat/completions", s.handleAPI)
	mux.HandleFunc("POST /v1/messages", s.handleAPI)
	mux.HandleFunc("POST /v1/responses", s.handleAPI)
	mux.HandleFunc("POST /v1/{path...}", s.handleAPI)
	mux.HandleFunc("POST /v1beta/{path...}", s.handleAPI)
	return mux
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_, _ = io.WriteString(w, `{"ok":true}`)
}

func (s *Server) handleStats(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(s.Stats.Snapshot())
}

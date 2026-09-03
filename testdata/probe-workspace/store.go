package main

import (
	"errors"
	"sync"
)

var (
	ErrNotFound      = errors.New("item not found")
	ErrDuplicateSKU  = errors.New("duplicate sku")
	ErrNotImplemented = errors.New("not implemented")
)

// Item is a catalog row. PricePaise is the only money field; do not add floats.
type Item struct {
	SKU        string `json:"sku"`
	Name       string `json:"name"`
	PricePaise int    `json:"price_paise"`
	Stock      int    `json:"stock"`
}

type Store struct {
	mu    sync.Mutex
	items map[string]Item
}

func NewStore() *Store {
	return &Store{items: map[string]Item{
		"tea":  {SKU: "tea", Name: "Masala tea", PricePaise: 2500, Stock: 12},
		"samosa": {SKU: "samosa", Name: "Samosa", PricePaise: 1500, Stock: 40},
	}}
}

func (s *Store) List() []Item {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]Item, 0, len(s.items))
	for _, it := range s.items {
		out = append(out, it)
	}
	return out
}

func (s *Store) Get(sku string) (Item, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	it, ok := s.items[sku]
	return it, ok
}

func (s *Store) Create(it Item) error {
	return ErrNotImplemented
}

func (s *Store) UpdateStock(sku string, delta int) error {
	return ErrNotImplemented
}

func (s *Store) Delete(sku string) error {
	return ErrNotImplemented
}

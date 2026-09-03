# probe-workspace

Tiny snack-shop HTTP API used as the **cacheprobe** target repo.

This folder is a sibling of `decodedd` on purpose. The proxy under test must not freeze its own `handle.go` and quiz itself.

Incomplete on purpose: `Store.Create` / `UpdateStock` / `Delete` return `ErrNotImplemented`. No cart, no auth, no pagination.

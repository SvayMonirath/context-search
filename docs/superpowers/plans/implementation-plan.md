# Implementation Plan: Context Vault (100x Overhaul)

## Architecture Overview
Context Vault is a native macOS local-first personal intelligence vault built with Tauri v2 (Rust core) and React 19 (Vite + Tailwind CSS v4). It runs 100% on-device with zero cloud server overhead, zero unencrypted storage, and sub-15ms search latency.

---

### Parallel Batch 1: Security, Cryptography & PII Sanitization
- **Task 1.1**: Rust Cryptographic Engine (`crates/vault-crypto`)
  - **Consumes**: Master passphrase, raw bytes.
  - **Produces**: Argon2id key derivation, AES-256-GCM encryption/decryption, ciphertext blob container with authentication tags.
  - **Verification**: `cargo test -p vault-crypto`
- **Task 1.2**: Deterministic Local PII Redaction Engine (`crates/vault-pii`)
  - **Consumes**: Raw text strings from email or chat bodies.
  - **Produces**: Scrubbed text string with replaced tokens (`[REDACTED_PHONE]`, `[REDACTED_IBAN]`, `[REDACTED_SECRET]`), audit event ledger.
  - **Verification**: `cargo test -p vault-pii`

---

### Parallel Batch 2: Embedded Search Engine & Data Connectors
- **Task 2.1**: Embedded Hybrid Vector & FTS Indexer (`crates/vault-index`)
  - **Consumes**: Chunks with text and vectors (384-dim).
  - **Produces**: Inverted index (BM25 keyword search) + Vector similarity index (Cosine/DotProduct ANN) + hybrid ranking.
  - **Verification**: `cargo test -p vault-index`
- **Task 2.2**: Ethical Connectors & Archive Importers (`crates/vault-connectors`)
  - **Consumes**: Telegram JSON export files, local Markdown/PDF directory paths, Gmail mbox/JSON records.
  - **Produces**: Stream of normalized `CommunicationChunk` structs passed through the PII redactor.
  - **Verification**: `cargo test -p vault-connectors`

---

### Parallel Batch 3: Tauri v2 Core Desktop Application & IPC
- **Task 3.1**: Tauri v2 Application Shell & IPC API (`src-tauri`)
  - **Consumes**: `vault-crypto`, `vault-pii`, `vault-index`, `vault-connectors`.
  - **Produces**: Native macOS app window, global hotkey listener (`Cmd+Space`), Tauri IPC command handlers:
    - `search_vault(query: String, filter: Option<String>) -> Vec<SearchResult>`
    - `synthesize_memory(query: String, doc_ids: Vec<String>) -> SynthesisResult`
    - `import_archive(file_path: String) -> ImportStats`
    - `get_vault_stats() -> VaultStats`
    - `get_pii_audit_log() -> Vec<AuditEntry>`
  - **Verification**: `cargo check --manifest-path src-tauri/Cargo.toml && cargo test --manifest-path src-tauri/Cargo.toml`

---

### Parallel Batch 4: macOS Native Interface (React 19 + Tailwind v4)
- **Task 4.1**: Native 3-Pane Notes/Mail View (`ui/src`)
  - **Consumes**: Tauri IPC client hooks.
  - **Produces**: Sidebar (Sources/Folders), Middle List (Search Matches), Right Canvas (Recall answer + full message with quote highlights).
  - **Verification**: `pnpm --filter ui build && pnpm --filter ui test`
- **Task 4.2**: Global Spotlight HUD Overlay (`ui/src/components/Hud`)
  - **Consumes**: Global shortcut trigger and live search input.
  - **Produces**: Sub-15ms floating search palette with clipboard copy and instant dismiss.
  - **Verification**: Component and interaction tests.

---

### Parallel Batch 5: End-to-End Integration, Real-World Data & Verification
- **Task 5.1**: Comprehensive E2E Verification Suite
  - **Consumes**: End-to-end user flows with realistic sample emails, Telegram export data, and Obsidian notes.
  - **Produces**: Verified functional tests confirming sub-15ms queries, 100% PII redaction, encryption verification, and zero crashes.
  - **Verification**: Full terminal test suite passing with real output.

# Context Vault Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Context Vault from a mocked/simulated facade into a genuinely functional, persistent, encrypted, local personal memory engine.

**Architecture:** 
1. Persistent encrypted storage engine (`EncryptedVaultStorage`) using AES-256-GCM + Argon2id to persist indexed records to disk (`~/.context-vault/vault.enc`).
2. Real extractive text synthesis engine replacing the fake template format string with token-weighted sentence extraction.
3. Recursive native filesystem Markdown folder scanner with automatic PII sanitization.
4. Genuine file telemetry inspecting real disk metadata.
5. Clean UI wiring connecting user triggers to real Tauri IPC commands.

**Tech Stack:** Rust (edition 2021), Tauri v2, AES-256-GCM, Argon2id, React 19, TypeScript, Tailwind v4.

**Spec:** `audit-research-report.md`

## Global Constraints
- Zero mock strings or synthetic templates in production code.
- Zero fake metrics (`storage_kb`, `sources_count` must be derived from disk and index).
- Full disk persistence: documents must survive app restart.
- AES-256-GCM authenticated encryption on all stored disk records.
- Deterministic PII redaction on all ingested text.

---

### Parallel Batch 1: Core Encrypted Persistence & Real Extractive Synthesis

#### Task 1.1: Encrypted Disk Storage Engine (`vault-index`)
**Files:**
- Create: `crates/vault-index/src/storage.rs`
- Modify: `crates/vault-index/src/lib.rs`
- Modify: `crates/vault-index/Cargo.toml`
- Test: `crates/vault-index/tests/storage_test.rs`

**Interfaces:**
- Consumes: `vault_crypto::{encrypt, decrypt, DerivedKey, EncryptedBlob}`, `vault_index::IndexedDocument`
- Produces: `EncryptedVaultStorage::save_document(path, key, doc) -> Result<(), StorageError>`, `EncryptedVaultStorage::load_all(path, key) -> Result<Vec<IndexedDocument>, StorageError>`

- [ ] **Step 1: Add `vault-crypto` dependency to `crates/vault-index/Cargo.toml`**
- [ ] **Step 2: Write failing test in `crates/vault-index/tests/storage_test.rs` verifying write to disk, reload, decrypt, and wrong key rejection**
- [ ] **Step 3: Implement `EncryptedVaultStorage` in `crates/vault-index/src/storage.rs`**
- [ ] **Step 4: Run `cargo test -p vault-index` and verify test passes**

#### Task 1.2: Real Extractive Memory Synthesis Engine
**Files:**
- Create: `crates/vault-index/src/synthesis.rs`
- Modify: `crates/vault-index/src/lib.rs`
- Test: `crates/vault-index/tests/synthesis_test.rs`

**Interfaces:**
- Consumes: `SearchResult`, `query: &str`
- Produces: `synthesize_factual_answer(query: &str, results: &[SearchResult]) -> FactSynthesis`

- [ ] **Step 1: Write failing test in `crates/vault-index/tests/synthesis_test.rs` asserting real sentence extraction and dynamic sender extraction**
- [ ] **Step 2: Implement extractive scoring and sentence segmentation in `crates/vault-index/src/synthesis.rs`**
- [ ] **Step 3: Run `cargo test -p vault-index` and verify test passes**

---

### Parallel Batch 2: Real Ingestion & Disk Telemetry Integration

#### Task 2.1: Native Folder Ingestion & Real Telemetry in Tauri Backend
**Files:**
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/lib.rs`
- Test: `src-tauri/src/lib.rs` (integration tests)

**Interfaces:**
- Consumes: `vault_index::{HybridIndex, EncryptedVaultStorage, synthesize_factual_answer}`, `vault_connectors::MarkdownConnector`
- Produces: `import_markdown_folder(path) -> Result<usize, String>`, `get_vault_stats() -> Result<VaultStats, String>` with real disk bytes

- [ ] **Step 1: Update `AppState` in `src-tauri/src/lib.rs` with vault file path and automatic disk load on boot**
- [ ] **Step 2: Replace fake template in `commands::synthesize_memory` with `vault_index::synthesize_factual_answer`**
- [ ] **Step 3: Replace fake math in `commands::get_vault_stats` with `fs::metadata` disk size and distinct sources count**
- [ ] **Step 4: Implement recursive `.md` folder scanner in `commands::import_markdown_folder` with disk persistence**
- [ ] **Step 5: Write unit and integration tests proving disk reload and real statistics**

---

### Parallel Batch 3: UI Ground Truth & Dead Code Removal

#### Task 3.1: Connect UI to Real Commands & Remove Deceptive Elements
**Files:**
- Modify: `ui/src/App.tsx`
- Delete: `context_search_backend/`
- Delete: `context-search-frontend/`

- [ ] **Step 1: Add Folder import trigger and Telegram import modal to `ui/src/App.tsx`**
- [ ] **Step 2: Remove deceptive labels ("Local LanceDB Cache", fake Keychain badge)**
- [ ] **Step 3: Remove top flow debug bar; present clean macOS 3-pane window with genuine status**
- [ ] **Step 4: Remove legacy orphaned folders `context_search_backend/` and `context-search-frontend/`**
- [ ] **Step 5: Run `pnpm --prefix ui run build` and `cargo test --workspace`**

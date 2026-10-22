# Automated Connectors Implementation Plan (Obsidian, Gmail, Telegram, Notion)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Goal
Transform Context Vault from a manual snapshot importer into a continuous, automated background ingestion engine with live connectors for **Obsidian (Local Notes)**, **Gmail (Google Workspace)**, **Telegram**, and **Notion**, while preserving 100% on-device cryptography (AES-256-GCM) and PII sanitization.

---

## Architecture Overview

```text
+-----------------------------------------------------------------------------------+
|                            AUTOMATED CONNECTOR PIPELINE                           |
+-----------------------------------------------------------------------------------+
|  1. Obsidian Watcher    |  2. Gmail Connector   | 3. Telegram Bridge | 4. Notion Sync  |
|  (macOS fsevents/notify)|  (IMAP/OAuth cursor)  | (Live export/TDLib)| (Notion Blocks) |
+-------------------------+-----------------------+--------------------+-----------------+
                                      |
                                      v
                     +---------------------------------+
                     |    ConnectorState Watermarker   | (tracks cursor / last_sync_time)
                     +---------------------------------+
                                      |
                                      v
                     +---------------------------------+
                     |   PII Sanitization Buffer       | (Luhn, API keys, SSN, Phone)
                     +---------------------------------+
                                      |
                                      v
                     +---------------------------------+
                     | Deduplication & Crypto Storage  | (SHA-256 dedupe, AES-256-GCM)
                     +---------------------------------+
                                      |
                                      v
                     +---------------------------------+
                     |  Sovereign BM25 Search Index    | (Instant offline search)
                     +---------------------------------+
```

---

## File Structure & Responsibilities

- `crates/vault_connectors/src/traits.rs`: Defines the generic `Connector` trait and `ConnectorRecord` DTO.
- `crates/vault_connectors/src/obsidian.rs`: Background filesystem watcher using `notify` (macOS `fsevents`) with 500ms debouncing and wikilink/frontmatter support.
- `crates/vault_connectors/src/gmail.rs`: Incremental email fetcher with UID watermarking, MIME parsing, and TLS 1.3 socket security.
- `crates/vault_connectors/src/telegram.rs`: Automated Telegram export folder watcher and streaming JSON message ingester.
- `crates/vault_connectors/src/notion.rs`: Notion block-tree recursive crawler using the Notion Search API with `last_edited_time` cursor pagination.
- `crates/vault_connectors/src/manager.rs`: Central connector orchestrator managing background sync intervals and state persistence.
- `src-tauri/src/lib.rs`: Exposes Tauri IPC commands for configuring, triggering, and monitoring the 4 connectors.
- `ui/src/App.tsx`: Updated 3-pane interface showing the 4 active collections with live sync status indicators.

---

## Execution Batches

### Parallel Batch 1: Common Connector Trait & Obsidian Live Watcher

#### Task 1.1: Common Connector Interface & Watermarking State
- **Consumes**: `crates/vault_connectors/Cargo.toml`
- **Produces**: `crates/vault_connectors/src/traits.rs`
- [ ] Define `ConnectorRecord` struct with `source_type`, `external_id`, `title`, `content`, `timestamp`, `metadata`.
- [ ] Define `ConnectorState` struct for cursor tracking (last synced ID / timestamp).
- [ ] Define `Connector` trait: `fn name(&self) -> &'static str; fn sync(&mut self, state: &ConnectorState) -> Result<Vec<ConnectorRecord>, ConnectorError>;`.
- [ ] Write unit test in `crates/vault_connectors/tests/connector_trait_test.rs`.

#### Task 1.2: Obsidian / Local Folder Live Watcher (`fsevents`)
- **Consumes**: `notify = "6.1"` dependency in `crates/vault_connectors/Cargo.toml`
- **Produces**: `crates/vault_connectors/src/obsidian.rs`
- [ ] Implement `ObsidianWatcher` using `notify::RecommendedWatcher`.
- [ ] Add 500ms debounce buffer to handle multi-stage file saves.
- [ ] Parse YAML frontmatter (`tags`, `aliases`, `title`) and strip wikilinks `[[Link|Text]]` into searchable plaintext.
- [ ] Write test `test_obsidian_file_modification_detection` in `crates/vault_connectors/tests/obsidian_test.rs`.

---

### Parallel Batch 2: Cloud Connectors (Gmail & Notion)

#### Task 2.1: Gmail Incremental Connector
- **Consumes**: `crates/vault_connectors/src/traits.rs`
- **Produces**: `crates/vault_connectors/src/gmail.rs`
- [ ] Implement `GmailConnector` with IMAP/TLS 1.3 connection using `async-imap` or `native-tls`.
- [ ] Implement UID watermarking: query `UID SEARCH UID {watermark}..*` so only new emails are pulled.
- [ ] Extract sender, subject, date, and clean plain-text body (stripping HTML formatting).
- [ ] Write mock test `test_gmail_incremental_uid_sync` in `crates/vault_connectors/tests/gmail_test.rs`.

#### Task 2.2: Notion Block Tree & Database Connector
- **Consumes**: `crates/vault_connectors/src/traits.rs`, `reqwest`
- **Produces**: `crates/vault_connectors/src/notion.rs`
- [ ] Implement `NotionConnector` using Notion API `/v1/search` with `filter: { property: "object", value: "page" }`.
- [ ] Add `sort: { direction: "descending", timestamp: "last_edited_time" }` for incremental synchronization.
- [ ] Recursively traverse `/v1/blocks/{id}/children` to flatten rich text, headings, and code blocks into markdown.
- [ ] Write mock test `test_notion_page_flattener` in `crates/vault_connectors/tests/notion_test.rs`.

---

### Parallel Batch 3: Telegram Bridge & Unified Manager

#### Task 3.1: Telegram Continuous Watcher & Parser
- **Consumes**: `crates/vault_connectors/src/traits.rs`
- **Produces**: `crates/vault_connectors/src/telegram.rs`
- [ ] Implement `TelegramWatcher` watching Telegram export directories for incoming `result.json` or channel exports.
- [ ] Stream and deduplicate messages by `(chat_id, message_id)` tuple.
- [ ] Write test `test_telegram_continuous_deduplication` in `crates/vault_connectors/tests/telegram_test.rs`.

#### Task 3.2: Unified Connector Orchestrator & Tauri IPC
- **Consumes**: Tasks 1.1, 1.2, 2.1, 2.2, 3.1
- **Produces**: `crates/vault_connectors/src/manager.rs`, `src-tauri/src/lib.rs`
- [ ] Implement `ConnectorManager` executing periodic sync loops on background threads.
- [ ] Expose Tauri IPC commands:
  - `start_obsidian_watcher(path: String)`
  - `sync_gmail(credentials: GmailConfig)`
  - `sync_notion(api_key: String)`
  - `get_connector_statuses() -> Vec<ConnectorStatus>`
- [ ] Write integration test `test_connector_manager_orchestration` in `src-tauri/tests/connector_integration_test.rs`.

---

### Parallel Batch 4: UI Screen & Live Source Toggles

#### Task 4.1: Modernized 4-Collection Interface & Connector Settings
- **Consumes**: `ui/src/App.tsx`, `ui/src/index.css`
- **Produces**: Updated `ui/src/App.tsx`
- [ ] Add the 4 primary collections to the left sidebar:
  - All Documents
  - Obsidian & Notes
  - Gmail
  - Telegram
  - Notion
- [ ] Add Connector Status & Settings drawer:
  - Obsidian: Local path picker with live "Watching" green indicator.
  - Gmail: Account connection status with last sync timestamp.
  - Telegram: Live directory sync state.
  - Notion: API key input and page count counter.
- [ ] Verify clean Vite build (`pnpm --prefix ui build`) and 0 `design-taste-frontend` lint errors.

---

## Empirical Verification Gates

1. `cargo test --workspace` — All existing 26 tests + new connector tests pass.
2. `node ~/.gemini/config/skills/design-taste-frontend/scripts/lint.mjs ui/src/App.tsx` — 0 FAILs.
3. `pnpm --prefix ui build` — Clean Vite compilation.

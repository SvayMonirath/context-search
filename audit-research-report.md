# AUTONOMOUS PRODUCT INTEGRITY & GROUND-TRUTH CODEBASE AUDIT

**Target Repository**: Context Vault (`context-search`)  
**Auditor**: Senior Principal Systems Architect & Product Integrity Auditor  
**Audit Date**: October 22, 2026  
**Audited Revision**: `main` (Git SHA HEAD)  
**Deliverable**: Comprehensive Ground-Truth Audit Report (`audit-research-report.md`)

---

## SECTION 1 — EXECUTIVE GROUND TRUTH

### 1.1 Executive Summary

Context Vault presents itself as a 100% on-device, sovereign desktop memory engine for macOS that encrypts personal communications (Obsidian, Gmail, Telegram, Notion) with AES-256-GCM and provides sub-15ms BM25 factual search with extractive citation synthesis.

The audit reveals a stark divergence between **what the product claims/presents** and **what the code actually delivers on first run**:

1. **Fake Pre-Seeded Demo Data (Critical Ground-Truth Violation)**:
   When a new user launches the application for the very first time on a blank machine, the app calls `init_demo_seed_to_disk()` in `src-tauri/src/lib.rs` (lines 182-222, 250). It silently writes two synthetic documents into the encrypted disk ledger (`vault.enc`): a fake email from "Sarah Jenkins <sarah@studio.com>" discussing a "$12,500 redesign budget" and a fake markdown file "Projects/Acme.md". In the browser preview (`context-vault-preview.html`), an additional 4 hardcoded sample items are rendered. **The user opens a supposedly private personal vault and immediately encounters simulated documents they never created.**

2. **Total Absence of Onboarding & First-Run Setup**:
   There is zero First-Run Experience (FRE). The application does not introduce its sovereign memory model, explain how local data is handled, ask the user to connect their accounts, or guide them through their initial import. It immediately opens a pre-populated search dashboard.

3. **Bypassed Master Authentication & Zero Lock Screen**:
   While the documentation claims "Argon2id key derivation" and "zero-knowledge encryption", the application never prompts the user for a master passphrase or sign-in. In `src-tauri/src/lib.rs` (lines 77-105), `get_or_create_master_passphrase()` generates an unprompted 48-character machine string, writes it to `~/.context-vault/vault.passphrase`, and automatically unlocks and decrypts the database on every boot. Anyone with physical access to the machine opens the app directly into plaintext memory.

4. **Genuine Core Functionality (What Actually Works)**:
   Behind the pre-seeded facade, the low-level backend components are real and robust:
   - **`vault_crypto`**: Real AES-256-GCM authenticated encryption and Argon2id key derivation.
   - **`vault_pii`**: Real regex and Luhn-algorithm redactor for credit cards, SSNs, API tokens, and phone numbers.
   - **`vault_index`**: Real in-memory BM25 inverted index with term frequency saturation ($k_1 = 1.2$) and document length normalization ($b = 0.75$).
   - **`vault_connectors`**: Real REST API client for Gmail (decoding base64url MIME), real Notion API block flattener, real Obsidian frontmatter/wikilink parser, and real Telegram JSON export parser.

5. **Key Disconnects**:
   - The live file watcher (`start_obsidian_watcher`) is implemented in `crates/vault-connectors/src/obsidian.rs` but is **never invoked** in the Tauri runtime; Obsidian sync only occurs during periodic 60-second polling.
   - Vector search structures (`vector: Vec<f32>`, `cosine_similarity`) exist in `vault_index`, but all document ingestion paths pass `vector: vec![]` because no local embedding model exists.

---

### 1.2 Product DNA

- **Product Archetype**: Local-First Desktop Memory & Knowledge Base (Tauri v2 + Rust + React 19).
- **Core Product Promise**: Centralize external communication and note data (Obsidian, Gmail, Telegram, Notion) into an encrypted, on-device BM25 index with instantaneous, verifiable factual extraction.
- **Critical Integrity Surfaces**:
  1. Authenticity of indexed documents (no seeded or fabricated records).
  2. Cryptographic key custody (user-controlled passphrase vs silent machine file).
  3. Continuous background ingestion fidelity (live watching vs manual polling).
  4. Privacy and PII scrubbing (redacting credentials before disk write).

---

### 1.3 Audit Coverage Statement

```text
INSPECTED:
  - crates/vault-crypto/ (src/lib.rs, tests)
  - crates/vault-pii/ (src/lib.rs, tests)
  - crates/vault-index/ (src/lib.rs, src/storage.rs, src/synthesis.rs, tests)
  - crates/vault-connectors/ (src/lib.rs, src/traits.rs, src/obsidian.rs, src/gmail.rs, src/notion.rs, src/telegram.rs, src/manager.rs, tests)
  - src-tauri/ (src/main.rs, src/lib.rs, src/commands.rs, Cargo.toml, tauri.conf.json)
  - ui/ (src/App.tsx, src/main.tsx, package.json, vite.config.ts)
  - context-vault-preview.html (Mockup & visual sandbox)
  - Cargo.toml, Cargo.lock, package.json, pnpm-workspace.yaml, PRODUCT.md

PARTIALLY INSPECTED:
  - archive/ (Legacy prototypes, verified obsolete)

NOT AVAILABLE / NOT INSPECTED:
  - None (Full repository inspected)
```

---

## SECTION 2 — FEATURE TRUTH MATRIX

| Feature / Subsystem | Claim Source | Trigger | Backend Wired | Inputs Used | Real Side Effect | Persisted / External Action | Read-Back | Implementation State | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **First-Run Onboarding** | Product Expectations | App Launch | NO | NO | None | None | None | **NOT IMPLEMENTED** | **HIGH** |
| **Master Passphrase Authentication** | `PRODUCT.md`, Security Claims | App Boot | PARTIAL | NO | Auto-generates machine string | Writes `vault.passphrase` | Re-reads machine string | **PARTIAL** | **HIGH** |
| **Demo Seed Ingestion** | UI / Runtime | Empty Vault Boot | YES | N/A | Injects fake Sarah Jenkins & Acme docs | Appends to `vault.enc` | Displayed on search | **MOCKED** | **CRITICAL** |
| **Obsidian Folder Crawl** | Connect Modal | `sync_obsidian` IPC | YES | YES | Parses Markdown, frontmatter, wikilinks | Appends to `vault.enc` | Searchable in BM25 | **VERIFIED** | INFO |
| **Obsidian Live FS Watcher** | `obsidian.rs` | FS Events | NO | N/A | `start_obsidian_watcher` exists | None in Tauri runtime | None | **DISCONNECTED** | **MEDIUM** |
| **Gmail OAuth REST Sync** | Connect Modal | `sync_gmail` IPC | YES | YES | Fetches `/messages`, decodes MIME | Appends to `vault.enc` | Searchable in BM25 | **VERIFIED** | INFO |
| **Gmail OAuth Flow** | Connect Modal | User Click | NO | PARTIAL | Requires manual bearer token paste | None | None | **PARTIAL** | **MEDIUM** |
| **Notion API Sync** | Connect Modal | `sync_notion` IPC | YES | YES | Fetches `/v1/search`, flattens blocks | Appends to `vault.enc` | Searchable in BM25 | **VERIFIED** | INFO |
| **Telegram Export Parser** | Connect Modal | `sync_telegram` IPC | YES | YES | Parses `result.json`, deduplicates | Appends to `vault.enc` | Searchable in BM25 | **VERIFIED** | INFO |
| **Continuous Background Sync** | Setup Worker | 60s Ticker | YES | YES | Invokes configured connectors | Appends new records to `vault.enc` | Searchable in BM25 | **VERIFIED** | INFO |
| **Encrypted Connector Storage** | `src-tauri/src/lib.rs` | Config Save | YES | YES | AES-256-GCM encrypted blob | Writes `connectors.enc` (0600) | Restored on boot | **VERIFIED** | INFO |
| **BM25 Inverted Search** | Search Input | `search_vault` IPC | YES | YES | Tokenization, TF-IDF, saturation | In-memory query | Returns matches | **VERIFIED** | INFO |
| **Vector Hybrid Search** | `vault-index/src/lib.rs` | `search` method | PARTIAL | NO | Computes cosine similarity | Documents have `vec![]` | Always empty | **DISCONNECTED** | **LOW** |
| **Direct Synthesis** | UI Header Card | `synthesize_memory` | YES | YES | Token-weighted sentence ranker | In-memory extraction | Returns top quote | **CODE-CONFIRMED** | INFO |
| **PII Scrubbing** | Ingestion Pipeline | Pre-persistence | YES | YES | Regex + Luhn check | Redacts text before encrypting | Audit log written | **VERIFIED** | INFO |
| **Global HUD Summon** | `tauri.conf.json` | `Cmd+Shift+Space` | YES | YES | Tauri global shortcut plugin | Emits `toggle-hud` event | HUD window toggled | **VERIFIED** | INFO |

---

## SECTION 3 — CRITICAL PRODUCT JOURNEYS

### Journey 1: First-Run Experience & Authentication (BROKEN)

```text
[Expected Sovereign Flow]
User launches app
  → App detects no vault exists
  → Displays First-Run Onboarding Screen
  → Prompts user to choose Master Passphrase
  → Derives AES-256 key via Argon2id (never stored on disk)
  → Prompts user to connect their first data source (Obsidian / Gmail / Telegram / Notion)
  → Vault starts completely empty with 0 documents.

[Actual Current Flow]
User launches app
  → App checks if vault.enc exists (false)
  → get_or_create_master_passphrase() silently generates 48-char random string
  → Writes plaintext passphrase to ~/.context-vault/vault.passphrase [SECURITY DEFECT]
  → init_demo_seed_to_disk() silently creates 2 fake documents [MOCK DEFECT]
  → Encrypts fake documents and saves to vault.enc
  → UI opens immediately to search feed containing Sarah Jenkins $12,500 email [USER SEES FAKE DATA]
```

### Journey 2: Obsidian Ingestion & Search (GENUINE WITH DISCONNECTED WATCHER)

```text
User enters Obsidian folder path in Connect Modal
  → Clicks "Sync Vault"
  → IPC calls `sync_obsidian(folder_path)`
  → Rust invokes `ObsidianConnector::sync()`
  → Recursively crawls `.md`, `.markdown`, `.txt`, `.org` files
  → Parses YAML frontmatter and resolves [[wikilinks]]
  → PiiScrubber redacts phone numbers, SSNs, credit cards
  → Appends encrypted chunks to `vault.enc`
  → Inserts documents into `HybridIndex`
  → Search bar immediately finds note content.
[DISCONNECT]: `start_obsidian_watcher` exists in `obsidian.rs` but is not started by Tauri `setup()`.
Live file changes only sync when the 60-second periodic poll fires or manual sync is clicked.
```

### Journey 3: Factual Search & Synthesis (GENUINE EXTRACTIVE)

```text
User types query in search bar (e.g., "redesign budget")
  → IPC triggers `search_vault(query)`
  → Rust `HybridIndex` tokenizes query
  → Computes BM25 score with k1=1.2, b=0.75 across inverted index
  → Ranks candidate documents and returns top 15 results
  → Simultaneously triggers `synthesize_memory(query)`
  → `synthesize_factual_answer()` splits top document into sentences
  → Scores sentences by query token overlap
  → Extracts top sentence with exact sender and timestamp citation
  → UI renders Direct Synthesis card with 1-click Copy button.
```

---

## SECTION 4 — DETAILED FINDINGS

### Finding MOCK-001: Automatic Injection of Synthetic Demo Records on First Launch
- **Subsystem**: `src-tauri/src/lib.rs` (lines 182-222, 250)
- **Implementation State**: **MOCKED**
- **Severity**: **CRITICAL**
- **Defect Category**: `MOCK / SIMULATION`
- **Claimed Behavior**: Context Vault is a sovereign personal search tool that indexes the user's communications.
- **Ground Truth**: On a fresh install where no database exists, the application automatically fabricates and indexes two synthetic records:
  ```rust
  // src-tauri/src/lib.rs:182
  pub fn init_demo_seed_to_disk(vault_path: &std::path::Path, key: &DerivedKey, index: &mut HybridIndex) {
      let doc1 = GmailConnector::parse_email(
          "sow-final-101",
          "SOW Agreement Final - Redesign Budget",
          "Sarah Jenkins <sarah@studio.com>",
          "From: Sarah Jenkins <sarah@studio.com>\n\nHey,\n\nI reviewed the proposal document you sent over this morning. The $12,500 total sounds fair...",
          ...
      );
      ...
  }
  ```
- **Broken Execution Chain**: User launches fresh app $\rightarrow$ App executes `init_demo_seed_to_disk()` $\rightarrow$ User sees fake emails from strangers in their private search engine.
- **User Consequence**: Destroys product trust immediately. The user believes the app is a fake demo or mock.
- **Required Resolution**: **MUST FIX**. Remove `init_demo_seed_to_disk()` completely from the application entrypoint. A clean installation must initialize with 0 documents.

---

### Finding ONBOARD-001: Missing First-Run Experience & Empty State
- **Subsystem**: `ui/src/App.tsx`
- **Implementation State**: **NOT IMPLEMENTED**
- **Severity**: **HIGH**
- **Defect Category**: `CLAIM / IMPLEMENTATION MISMATCH`
- **Claimed Behavior**: Intuitive, frictionless desktop memory engine.
- **Ground Truth**: There is no onboarding flow, no setup wizard, and no informative empty state when the vault contains zero documents. When the fake seed data is removed, the app presents an empty list without explaining what Context Vault is or how to connect a data source.
- **User Consequence**: New users are disoriented and have no guidance on connecting their Obsidian notes, Gmail, Telegram, or Notion.
- **Required Resolution**: **MUST FIX**. Build a clean First-Run Onboarding screen that triggers when `stats.total_messages === 0`, guiding the user through connecting their first source.

---

### Finding AUTH-001: Bypassed Master Passphrase & Hardcoded Machine Key File
- **Subsystem**: `src-tauri/src/lib.rs` (lines 77-105)
- **Implementation State**: **PARTIAL**
- **Severity**: **HIGH**
- **Defect Category**: `HARDCODED BEHAVIOR`
- **Claimed Behavior**: Zero-knowledge cryptographic vault protecting user privacy.
- **Ground Truth**:
  ```rust
  // src-tauri/src/lib.rs:77
  pub fn get_or_create_master_passphrase(vault_dir: &std::path::Path) -> String {
      let pass_path = vault_dir.join("vault.passphrase");
      if pass_path.exists() {
          if let Ok(pass) = std::fs::read_to_string(&pass_path) {
              return pass.trim().to_string();
          }
      }
      let new_passphrase: String = rand::thread_rng().sample_iter(&Alphanumeric).take(48).map(char::from).collect();
      let _ = write_secure_file(&pass_path, new_passphrase.as_bytes());
      new_passphrase
  }
  ```
  The user is never asked to choose or enter a password. The application generates an unprompted 48-character machine string, writes it to `vault.passphrase`, and automatically decrypts data on boot.
- **User Consequence**: The user cannot set their own password or lock their vault. Anyone opening the app has immediate access.
- **Required Resolution**: **MUST FIX**. Implement a Master Passphrase Setup on first run and a Lock Screen on subsequent app launches. The derived key should stay in memory and not be auto-unlocked from a plaintext file unless explicitly requested via system keychain.

---

### Finding WATCH-001: Disconnected Obsidian Live Filesystem Watcher
- **Subsystem**: `crates/vault-connectors/src/obsidian.rs` (lines 275-316) vs `src-tauri/src/lib.rs`
- **Implementation State**: **DISCONNECTED**
- **Severity**: **MEDIUM**
- **Defect Category**: `DISCONNECTED PLUMBING`
- **Claimed Behavior**: Continuous live filesystem sync when Obsidian notes are modified.
- **Ground Truth**: The `start_obsidian_watcher()` function using `notify::RecommendedWatcher` is fully written and tested in `vault-connectors`, but it is **never instantiated** in `src-tauri/src/lib.rs`. The Tauri backend only executes periodic 60-second polling.
- **User Consequence**: Changes made in Obsidian do not reflect immediately in Context Vault; they only update after the 60-second polling interval.
- **Required Resolution**: **MUST FIX**. Spawn `start_obsidian_watcher` in a background thread when an Obsidian path is configured, streaming file events directly into `ingest_connector_records`.

---

### Finding VEC-001: Disconnected Vector Search in Hybrid Index
- **Subsystem**: `crates/vault-index/src/lib.rs` (lines 78-91, 214-225) vs `src-tauri/src/commands.rs`
- **Implementation State**: **DISCONNECTED**
- **Severity**: **LOW**
- **Defect Category**: `DEAD CODE / DISCONNECTED PLUMBING`
- **Claimed Behavior**: Hybrid BM25 + Vector Search (Reciprocal Rank Fusion).
- **Ground Truth**: The vector cosine similarity calculation and RRF fusion code are implemented in `vault_index`, but `src-tauri/src/commands.rs` always sets `vector: vec![]` when inserting documents, and `search_vault_impl` passes `query_vector: None`. There is no local embedding model (ONNX/candle) integrated.
- **User Consequence**: Search executes purely via BM25 keyword search. Vector semantic search is inactive.
- **Required Resolution**: **KEEP / DEFER**. Document that search currently uses pure BM25 with term saturation, and defer on-device embedding models to a future milestone.

---

### Finding OAUTH-001: Manual Token Requirement for Gmail and Notion
- **Subsystem**: `ui/src/App.tsx` (lines 610-675)
- **Implementation State**: **PARTIAL**
- **Severity**: **MEDIUM**
- **Defect Category**: `PARTIAL IMPLEMENTATION`
- **Claimed Behavior**: Seamless cloud software connectors.
- **Ground Truth**: Ingestion and parsing logic are 100% real, but the user must manually acquire an OAuth access token (`ya29...`) or Notion secret (`secret_...`) and paste it into an input field. There is no automated OAuth2 PKCE browser redirect loop.
- **User Consequence**: Higher technical barrier for non-technical users to connect Gmail.
- **Required Resolution**: **MUST FIX / DEFER**. Provide clear copy explaining where to obtain the token, or implement a local loopback OAuth2 redirect server.

---

## SECTION 5 — MOCK / THEATER REGISTER

| Finding ID | Location | Mechanism | Can Reach Real Users? | Strategic Decision |
| :--- | :--- | :--- | :--- | :--- |
| **MOCK-001** | `src-tauri/src/lib.rs:182` | `init_demo_seed_to_disk`: Seeds fake Sarah Jenkins & Acme docs | **YES** (Executes on first run) | **KILL IMMEDIATELY** |
| **MOCK-002** | `context-vault-preview.html:467` | `const sampleData = [...]`: Hardcoded 4 mock items in HTML | **YES** (Visible in preview) | **KILL / REPLACE** |

---

## SECTION 6 — DISCONNECTED PLUMBING REGISTER

| Component | Destination | Status | Impact |
| :--- | :--- | :--- | :--- |
| `start_obsidian_watcher` (`obsidian.rs:275`) | Tauri setup loop (`lib.rs:280`) | Not wired | File changes require 60s poll instead of instantaneous event update |
| `IndexedDocument.vector` (`vault-index:34`) | Embedding generator | Not wired (`vec![]`) | Vector scoring path never activates; runs BM25 only |

---

## SECTION 7 — GHOST STORAGE & STATE INTEGRITY

- **Vault Ledger (`vault.enc`)**: **GENUINE**. AES-256-GCM encrypted chunks appended to disk; persisted and decrypted across restarts.
- **Audit Log (`audit.enc`)**: **GENUINE**. Encrypted JSON array of PII redactions persisted and decrypted across restarts.
- **Connector Config (`connectors.enc`)**: **GENUINE**. Encrypted connector credentials persisted with POSIX 0600 file modes.
- **Master Passphrase (`vault.passphrase`)**: **GHOST SECURITY**. Storing the machine passphrase in plaintext on disk compromises the zero-knowledge security claim.

---

## SECTION 8 — DEAD / ORPHANED FUNCTIONALITY

- **Vector Cosine Similarity & RRF Vector Branch**: Operates cleanly in unit tests, but dormant in production flows due to absence of an on-device embedding model.
- **`archive/legacy/` Directory**: Deprecated legacy files; cleanly quarantined from active compilation.

---

## SECTION 9 — SANDBOX / REAL-PATH PARITY

| Feature | Browser Preview (`localhost:8888`) | Real Desktop App (`pnpm tauri dev`) | Parity Status |
| :--- | :--- | :--- | :--- |
| **UI Components** | Static HTML + Tailwind CDN | React 19 + Tailwind v4 + Vite | Parity in Visual Hierarchy |
| **Search Engine** | Hardcoded array filter | Native Rust BM25 Inverted Index | **DIVERGENT** (Real app uses true BM25) |
| **Encryption** | None (Visual simulation) | Real AES-256-GCM + Argon2id | **DIVERGENT** (Real app encrypts disk files) |
| **Data Ingestion** | Click alerts | Real API callers & file readers | **DIVERGENT** (Real app parses real files) |

---

## SECTION 10 — FIX VS KILL STRATEGIC MATRIX

| Finding / Feature | Current State | Importance | Strategic Decision | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Synthetic Demo Seed** (`MOCK-001`) | MOCKED | Harmful | **KILL** | Falsifies user memory; causes immediate distrust. |
| **First-Run Onboarding** (`ONBOARD-001`) | NOT IMPLEMENTED | Critical | **MUST FIX** | Required for users to understand and setup their vault. |
| **Master Passphrase Lock Screen** (`AUTH-001`) | PARTIAL | Critical | **MUST FIX** | Core sovereign security promise requires user-held key. |
| **Obsidian Live FS Watcher** (`WATCH-001`) | DISCONNECTED | High | **MUST FIX** | Native instant file sync is a core local value proposition. |
| **Manual Token Ingestion** (`OAUTH-001`) | PARTIAL | Medium | **KEEP & IMPROVE** | Functional for technical users; add PKCE OAuth helper later. |
| **Vector Embedding Branch** (`VEC-001`) | DISCONNECTED | Low | **DEFER** | BM25 full-text search is fast, accurate, and completely sovereign. |

---

## SECTION 11 — ORDERED REMEDIATION ROADMAP

### Task 1: Eliminate Synthetic Demo Seeding (Immediate Trust Recovery)
- **Finding ID**: `MOCK-001`
- **File**: `src-tauri/src/lib.rs` (lines 182-222, 250)
- **Action**: Delete `init_demo_seed_to_disk()` entirely. When `vault.enc` does not exist, initialize an empty `HybridIndex` with 0 documents.
- **Dependency**: None.
- **Acceptance Test**:
  ```bash
  rm -rf ~/.context-vault
  pnpm dev
  # Vault must open with exactly 0 messages in stats and empty document feed.
  ```

### Task 2: Implement First-Run Onboarding & Zero-State UI
- **Finding ID**: `ONBOARD-001`
- **File**: `ui/src/App.tsx`
- **Action**: Add an Onboarding Screen when `stats.total_messages === 0`. Display:
  1. Explanation of Context Vault's 100% on-device sovereign memory model.
  2. One-click setup cards to connect their first source (Obsidian Vault or local folder).
  3. Reassurance that all data remains local and encrypted with AES-256.
- **Dependency**: Task 1.
- **Acceptance Test**: On a clean vault, the app displays the onboarding setup screen rather than an empty dashboard.

### Task 3: Implement User-Controlled Master Passphrase & Vault Lock
- **Finding ID**: `AUTH-001`
- **File**: `src-tauri/src/lib.rs`, `src-tauri/src/commands.rs`, `ui/src/App.tsx`
- **Action**:
  1. On first run, prompt user to create their Master Passphrase.
  2. On subsequent launches, show a clean Unlock Screen prompting for the passphrase.
  3. Derive key in memory using Argon2id. Delete `vault.passphrase` plaintext storage.
- **Dependency**: Task 2.
- **Acceptance Test**:
  - Wrong passphrase fails decryption with an error.
  - Correct passphrase unlocks the vault and loads encrypted documents.
  - No plaintext passphrase file exists on disk.

### Task 4: Connect Obsidian Live Filesystem Watcher in Runtime
- **Finding ID**: `WATCH-001`
- **File**: `src-tauri/src/lib.rs`, `crates/vault-connectors/src/obsidian.rs`
- **Action**: In `setup()`, when `connectors_config.obsidian_path` is present, spawn `start_obsidian_watcher()`, listen on `event_receiver`, and ingest modified notes immediately.
- **Dependency**: None.
- **Acceptance Test**: Editing a `.md` file inside the configured Obsidian directory updates Context Vault's search index within 500ms without waiting for the 60-second polling cycle.

---

## SECTION 12 — UNVERIFIED AREAS

1. **Gmail OAuth Token Expiration Behavior**:
   - *Status*: UNVERIFIED under automatic token refresh.
   - *Why*: Automated test suite verifies message fetching with mock access tokens; live Google refresh token rotation was not tested with live Google servers during this local audit.
   - *Resolution*: Test live token expiration against Google OAuth endpoint.

2. **Notion 100+ Page Pagination**:
   - *Status*: UNVERIFIED with real workspaces containing $>100$ pages.
   - *Why*: Notion Search API returns up to 100 results per page; while pagination loop is coded, real-world rate limits (3 req/sec) require empirical observation on large workspaces.

# Context Vault Comprehensive Remediation Implementation Plan

> **Goal:** Resolve all product integrity gaps, ghost storage vectors, disconnected plumbing, and ledger bloat identified in the Product Integrity Audit.

## Batch 10: Synthesis Filter Scoping & Empty Query Recents
- [ ] Task 10.1: In `crates/vault-index/src/lib.rs`, when `query.trim().is_empty()`, return recent documents (optionally filtered by `source_filter`) sorted by `timestamp` descending with `score: 1.0`.
- [ ] Task 10.2: In `crates/vault-index/src/synthesis.rs`, handle empty query by returning a prompt to search rather than "No matching records found".
- [ ] Task 10.3: In `src-tauri/src/commands.rs`, update `synthesize_memory` to accept `filter: Option<String>` and pass it to `synthesize_memory_impl`.
- [ ] Task 10.4: In `ui/src/App.tsx`, pass `filter: activeFilter === 'All' ? null : activeFilter` in `synthesize_memory` invoke call.
- [ ] Task 10.5: Write unit tests in `crates/vault-index` and `src-tauri` asserting filtered synthesis and empty query recents.

## Batch 11: PII Audit Log Encrypted Disk Persistence
- [ ] Task 11.1: In `src-tauri/src/lib.rs`, define encrypted audit log persistence functions (`save_audit_log`, `load_audit_log`).
- [ ] Task 11.2: In `src-tauri/src/lib.rs`, load existing audit records from `audit.enc` on startup.
- [ ] Task 11.3: In `src-tauri/src/commands.rs`, when PII is redacted during import, persist the updated audit log to `audit.enc`.
- [ ] Task 11.4: Write test `test_pii_audit_log_restart_persistence` proving audit history survives application restart.

## Batch 12: Ingestion Deduplication & Compaction Engine
- [ ] Task 12.1: In `crates/vault-index/src/storage.rs`, implement `compact_ledger(path, key, docs)` to safely rewrite the encrypted ledger with unique records.
- [ ] Task 12.2: In `src-tauri/src/commands.rs`, deduplicate documents during folder, email, and telegram imports so existing identical documents are not appended repeatedly.
- [ ] Task 12.3: Write test `test_folder_import_deduplication_and_compaction` verifying that re-importing the same folder twice maintains constant ledger size.

## Batch 13: Native File Picker for Telegram Archives & UI Alignment
- [ ] Task 13.1: In `src-tauri/src/commands.rs`, add `import_telegram_file` IPC command to read Telegram JSON directly from filesystem.
- [ ] Task 13.2: Register `import_telegram_file` in `src-tauri/src/lib.rs`.
- [ ] Task 13.3: In `ui/src/App.tsx`, add file path input for Telegram import alongside paste option.
- [ ] Task 13.4: In `ui/src/App.tsx`, update shortcut labels to consistently display `⌘⇧Space` as the global shortcut and `⌘Space` as in-app toggle; initialize query to `""` so recent items display on boot.

## Batch 14: Deprecate Legacy Monolith & Purge Bloat
- [ ] Task 14.1: Remove dead `node_modules` from `archive/legacy` (133MB bloat).
- [ ] Task 14.2: Run `cargo test --workspace` and `pnpm --prefix ui build` to verify 100% green build and test suites.
- [ ] Task 14.3: Update `docs/superpowers/plans/progress.md` and `audit-research-report.md`.

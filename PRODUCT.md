# Product

<!-- impeccable:product-schema 1 -->

## Platform

macOS Desktop (Tauri v2)

## Stack

Tauri v2 (Rust backend), React 19, Vite, Tailwind CSS v4, AES-256-GCM, Argon2id, Embedded BM25 Inverted Index.

## Users

Knowledge workers, developers, executives, researchers, and privacy-conscious professionals who manage communications across email, chats, and notes, and frequently lose time searching for past agreements, numbers, links, or context.

## Product Purpose

Provide an impenetrable, zero-knowledge personal memory vault that allows users to instantly search, verify, and converse with their entire communication history in milliseconds, without exposing any private data to cloud providers.

## Positioning

A 100% on-device, local-first intelligence vault. Unlike cloud-based personal AI tools that store unencrypted personal communications on remote servers, Context Vault guarantees zero plaintext leaves the user's hardware.

## Operating Context

- **Global Quick Recall (HUD)**: `Cmd+Shift+Space` (or `Cmd+Space`) system-wide hotkey overlay accessible from any app for sub-15ms factual lookup and citation copying.
- **Deep Context Workspace**: Dedicated window for multi-source exploration, exact document inspection, source filtering, and privacy audit logs.
- **Local-Only Ingestion**: Instant local folder scanning and chat/email import with automatic PII sanitization.

## Capabilities and Constraints

- **Capabilities**:
  - Embedded BM25 full-text search engine with term saturation (k1 = 1.2) and document length normalization (b = 0.75).
  - Deterministic extractive evidence recall with exact quote and timestamp attribution.
  - Client-side AES-256-GCM authenticated encryption derived via Argon2id with encrypted zero-knowledge verifier (`vault.verifier`), per-vault salt (`vault.salt`), and Master Passphrase setup and unlock screens.
  - Deterministic local PII scrubbing (Luhn-checked credit cards, SSNs, API keys, phone numbers, bank routing).
  - Connectors: Obsidian Markdown vault with live filesystem watching, Gmail incremental thread sync with REST API, Telegram Desktop JSON export ingestion with deduplication, and Notion workspace block hierarchy flattener.
  - Authentic First-Run Experience (FRE): Fresh vaults boot with 0 records and interactive setup cards guiding source connection; zero synthetic mock data.
- **Constraints**:
  - Zero external database daemons (no Docker, no PostgreSQL, no Redis).
  - Zero unencrypted communication text or plaintext passphrases written to disk.
  - 100% on-device local processing.

## Brand Commitments

- **Tone**: Quiet, precise, sovereign, dependable, industrial-grade luxury.
- **Metaphor**: A high-precision mechanical vault; a cryptographic extension of biological memory.

## Product Principles

1. **Sovereignty First**: The user's machine is the fortress. Zero telemetry, zero unencrypted cloud transmission.
2. **Speed is Respect**: Factual recall must happen in under 15ms. The UI must never block on model latency.
3. **Verifiable Truth**: The AI never fabricates memory; every claim links to an immutable, exact date and quote citation.
4. **Frictionless Invisibility**: Stay invisible in the menu bar until summoned via `Cmd+Space`.

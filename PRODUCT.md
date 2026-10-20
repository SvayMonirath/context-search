# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Tauri v2 (Rust backend), React 19, Vite, Tailwind CSS v4, shadcn/ui, LanceDB embedded, ONNX Runtime / Ollama.

## Users

Knowledge workers, developers, executives, researchers, and privacy-conscious professionals who manage communications across email, chats, and notes, and frequently lose time searching for past agreements, numbers, links, or context.

## Product Purpose

Provide an impenetrable, zero-knowledge personal memory vault that allows users to instantly search, verify, and converse with their entire communication history in milliseconds, without exposing any private data to cloud providers.

## Positioning

A 100% on-device, local-first intelligence vault. Unlike cloud-based personal AI tools (Rewind, Mem, Notion AI) that store unencrypted personal communications on remote servers, Context Vault guarantees zero plaintext leaves the user's hardware.

## Operating Context

- **Global Quick Recall (HUD)**: `Cmd+Space` hotkey overlay accessible from any app for sub-15ms factual lookup and citation copying.
- **Deep Context Workspace**: Dedicated window for multi-source conversation, complex document synthesis, timeline filtering, and privacy audit logs.
- **Local-Only Ingestion**: Background file watching and incremental Gmail/chat-archive ingestion without external daemons or Docker.

## Capabilities and Constraints

- **Capabilities**:
  - Embedded hybrid search (BM25 full-text + vector similarity + cross-encoder reranking).
  - Conversational memory assistant with deterministic source quote attribution.
  - Client-side AES-256-GCM authenticated encryption derived via Argon2id.
  - Deterministic local PII scrubbing (financial, credential, third-party data).
  - Dual AI inference (100% offline local SLM + optional BYOK cloud with pre-scrubbed context).
  - Connectors: Read-only Gmail OAuth, local Markdown/Obsidian vaults, PDF/documents, Telegram/WhatsApp archive bundles.
- **Constraints**:
  - Zero external database daemons (no Docker, no PostgreSQL, no Redis).
  - Zero unencrypted communication text written to disk.
  - Minimal background CPU and battery consumption on laptops.

## Brand Commitments

- **Tone**: Quiet, precise, sovereign, dependable, industrial-grade luxury.
- **Metaphor**: A high-precision mechanical vault; a cryptographic extension of biological memory.

## Product Principles

1. **Sovereignty First**: The user's machine is the fortress. Zero telemetry, zero unencrypted cloud transmission.
2. **Speed is Respect**: Factual recall must happen in under 15ms. The UI must never block on model latency.
3. **Verifiable Truth**: The AI never fabricates memory; every claim links to an immutable, exact date and quote citation.
4. **Frictionless Invisibility**: Stay invisible in the menu bar until summoned via `Cmd+Space`.

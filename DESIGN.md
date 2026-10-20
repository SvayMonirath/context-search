# Design System: Precision Titanium Instrument

<!-- impeccable:design-schema 1 -->

## 1. Visual Philosophy & World

Context Vault is built as a high-precision personal cryptographic instrument. It rejects frivolous sci-fi tropes (fake CRT scanlines, neon green hacker terminals, gratuitous pulsing dots) in favor of whisper-quiet, industrial-grade luxury—the tactile precision of an anodized titanium Leica camera combined with the frictionless speed of Raycast and Linear.

### Core Principles
1. **Whisper-Quiet Restraint**: The interface steps back so your personal memories and citations take center stage.
2. **Sub-15ms Spatial Immediacy**: Every keystroke updates split-pane views instantly. No layout shifts or skeleton flickers.
3. **Cryptographic Proof Over Aesthetic Fluff**: Verification badges, date stamps, and source attribution are legible, crisp, and verifiable at a glance.
4. **Keyboard-First Ergonomics**: Every action is reachable via vim-like keys (`j`/`k`), tab navigation, or global shortcuts (`Cmd+K`, `Cmd+Space`, `Cmd+Enter`).

---

## 2. Color Palette & Surface Tokens

### Surfaces (Anodized Titanium Scale)
* `--surface-base`: `#0b0d11` (Deep space titanium, true app canvas)
* `--surface-layer-1`: `#11141b` (Primary panels, sidebar, list view container)
* `--surface-layer-2`: `#171b24` (Cards, inspect drawer, active message blocks)
* `--surface-layer-3`: `#1f2430` (Hover states, elevated popovers, dropdowns)
* `--surface-overlay`: `rgba(11, 13, 17, 0.75)` (Backdrop blur with `backdrop-filter: blur(16px)`)

### Hairline Borders
* `--border-hairline`: `rgba(255, 255, 255, 0.07)` (Default crisp 1px division)
* `--border-subtle`: `rgba(255, 255, 255, 0.12)` (Component boundaries, inputs)
* `--border-focus`: `rgba(56, 189, 248, 0.5)` (Focused search inputs, active selection)

### Typography & Ink
* `--text-primary`: `#f1f5f9` (Slate-100, 95% contrast for readability)
* `--text-secondary`: `#94a3b8` (Slate-400, for body excerpts and descriptions)
* `--text-muted`: `#64748b` (Slate-500, for metadata, dates, labels)
* `--text-faint`: `#475569` (Slate-600, for shortcut hints and line numbers)

### Cryptographic Accents (Purpose-Driven)
* `--accent-cyan`: `#06b6d4` / `#38bdf8` (Cryptographic verification, local vault status)
* `--accent-emerald`: `#10b981` (100% On-Device / Zero Cloud indicator)
* `--accent-amber`: `#f59e0b` (BYOK Cloud transmission warning)
* `--accent-rose`: `#f43f5e` (Redaction alert, PII scrubbed marker)

---

## 3. Typography & Hierarchy

### Typefaces
* **Display & UI Body**: Modern System Humanist Sans (`Inter`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `sans-serif`)
  - Optical sizing active, tight tracking on titles (`-0.02em`), comfortable leading (`1.5`) on body.
* **Code & Cryptographic Readouts**: Refined Monospace (`"JetBrains Mono"`, `"SF Mono"`, `"Fira Code"`, monospace)
  - Used strictly for timestamps, file hashes, shortcut pills, and query execution times.

### Scale
* `text-2xs`: 10px / 14px (Keyboard shortcuts, status badges)
* `text-xs`: 12px / 16px (Metadata, source pill tags, timestamps)
* `text-sm`: 13px / 20px (Default interface text, search list items)
* `text-base`: 14px / 22px (Chat messages, note reader body)
* `text-lg`: 18px / 26px (Section headers, modal titles)
* `text-xl`: 24px / 32px (Vault overview, primary headings)

---

## 4. Component Standards

### 1. The Global Search HUD (`Cmd+Space`)
* Centered floating palette: 680px width, max 480px height.
* Background: `--surface-layer-1` with 1px `--border-hairline` and subtle deep box shadow (`0 20px 40px rgba(0,0,0,0.6)`).
* Search input: 44px height, zero native outline, 16px font, instant live filtering.
* Results list: Virtualized vertical stream with category dividers (`Emails`, `Notes`, `Chats`).
* Shortcut footer: Minimal status strip showing `↵ to copy`, `⌘↵ open workspace`, `esc close`.

### 2. The Split-Pane Workspace
* **Left Sidebar (220px)**: Collapsible navigation (All Memory, Starred, Timeline, Connectors, Privacy Audit, Settings).
* **Middle Column (340px)**: Fast query stream / conversation threads with unread indicators and source icons.
* **Right Canvas (Flex-1)**:
  - Deep reading pane with synthesized answer.
  - Interactive quote diff cards with verified date stamps and 1-click source jump.
  - PII Scrubbed indicator pill (`[3 entities redacted]`).

### 3. Keyboard Badges (`<Kbd>`)
* Compact 18px height, rounded 4px, background `rgba(255,255,255,0.06)`, border 1px `rgba(255,255,255,0.1)`.
* Font: `text-2xs` JetBrains Mono, uppercase.

---

## 5. Motion & Transitions

* **Spring Physics**: Durations kept strictly between 120ms and 200ms with cubic bezier `cubic-bezier(0.16, 1, 0.3, 1)`.
* **Zero Layout Shift**: Modals and drawers mount into reserved layouts or overlays.
* **Reduced Motion**: Respects `prefers-reduced-motion` by collapsing transitions into instant opacity swaps.

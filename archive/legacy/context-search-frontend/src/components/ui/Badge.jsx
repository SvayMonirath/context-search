// src/components/ui/Badge.jsx
// Status badges and labels used across the app.
// Usage: <Badge variant="live" /> or <Badge variant="profile" label="ADMIN_NODE_01" />

const VARIANTS = {
  // Green pulsing dot + text — live connection status
    live: { bg: 'transparent', border: 'none', color: 'var(--accent-green)', dot: 'var(--accent-green)', pulse: true },
    // Offline/muted status
    offline: { bg: 'transparent', border: 'none', color: 'var(--text-muted)', dot: 'var(--text-muted)', pulse: false },
    // Purple pill — active profile tag
    profile: { bg: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc' },
    // Dim box — labels like STRICTLY ISOLATED, WORKSPACE
    dim: { bg: 'var(--bg-base)', border: '1px solid var(--border-mid)', color: 'var(--text-dim)' },
    // Green pill — NOMINAL, SYNC_COMPLETE
    success: { bg: 'rgba(74,240,196,0.12)', border: '1px solid rgba(74,240,196,0.3)', color: 'var(--accent-green)' },
    // Amber pill — warnings
    warning: { bg: 'rgba(232,160,74,0.12)', border: '1px solid rgba(232,160,74,0.3)', color: 'var(--accent-amber)' },
    // Blue pill — info
    info: { bg: 'rgba(74,158,255,0.12)', border: '1px solid rgba(74,158,255,0.3)', color: 'var(--accent-blue)' },
};

export default function Badge({ variant = 'dim', label, style = {} }) {
    const v = VARIANTS[variant] || VARIANTS.dim;

    // Dot-only variants (live / offline)
    if (v.dot) {
        return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 9, letterSpacing: '0.12em', color: v.color,
            fontFamily: 'var(--font-mono)',
            ...style,
        }}>
            <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: v.dot, display: 'inline-block',
            animation: v.pulse ? 'pulse-dot 2s ease-in-out infinite' : 'none',
            }} />
            {label}
        </span>
        );
    }

    return (
        <span style={{
        display: 'inline-block',
        background: v.bg,
        border: v.border,
        color: v.color,
        fontSize: 8,
        letterSpacing: '0.14em',
        padding: '2px 8px',
        fontFamily: 'var(--font-mono)',
        ...style,
        }}>
        {label}
        </span>
    );
}

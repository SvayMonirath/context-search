// src/components/layout/PageShell.jsx
// Wraps every page with consistent background + optional top mini-label bar.
// Usage: <PageShell topBar="Profile Selection">...</PageShell>

export default function PageShell({ topBar, children }) {
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', overflow: 'hidden' }}>
        {topBar && (
            <div style={{
            padding: '5px 18px',
            background: 'rgba(10,11,14,0.95)',
            borderBottom: '1px solid var(--border-dim)',
            fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono)',
            }}>
            {topBar}
            </div>
        )}
        {children}
        </div>
    );
}

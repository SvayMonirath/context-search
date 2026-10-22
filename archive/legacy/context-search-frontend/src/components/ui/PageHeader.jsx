// src/components/ui/PageHeader.jsx
// The title + optional badge + description block at the top of dashboard pages.
// Usage: <PageHeader title="NEURAL_INTEGRATIONS" badge="ACTIVE_PROFILE: X" desc="..." />

import Badge from './Badge';

export default function PageHeader({ title, badge, badgeVariant = 'profile', desc, children }) {
  return (
    <div className="animate-fade-up" style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: badge || title ? 8 : 0 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28, fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '0.04em',
        }}>
          {title}
        </h1>
        {badge && <Badge variant={badgeVariant} label={badge} />}
      </div>
      {desc && (
        <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7, maxWidth: 560 }}>
          {desc}
        </p>
      )}
      {children}
    </div>
  );
}

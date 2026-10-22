// src/components/ui/Card.jsx
// All card / panel containers used across the app.
//
// variant="base"     → plain dark card with border
// variant="neural"   → card with corner brackets (profile cards)
// variant="feature"  → card with colored gradient top band (integrations feature cards)
// variant="info"     → left-accent info box (privacy notice, isolation protocol)
// variant="section"  → titled section panel (data governance, neural theme)
//
// Usage:
//   <Card variant="base">...</Card>
//   <Card variant="info" accentColor="var(--accent-amber)">...</Card>
//   <Card variant="feature" gradient="linear-gradient(...)">...</Card>

import CornerBrackets from './CornerBrackets';

function BaseCard({ children, style = {}, onClick, hoverable = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={hoverable ? () => setHovered(true) : undefined}
      onMouseLeave={hoverable ? () => setHovered(false) : undefined}
      style={{
        background: hoverable && hovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        border: `1px solid ${hoverable && hovered ? 'var(--border-hi)' : 'var(--border-dim)'}`,
        transition: 'all 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function NeuralCard({ children, style = {}, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        border: `1px solid ${hovered ? 'var(--border-bright)' : 'var(--border-dim)'}`,
        padding: '24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        ...style,
      }}
    >
      <CornerBrackets color={hovered ? '#4a9eff' : '#2e3a4f'} />
      {children}
      <div style={{
        position: 'absolute', bottom: 8, right: 8,
        width: 6, height: 6,
        background: 'var(--border-bright)',
      }} />
    </div>
  );
}

function FeatureCard({ icon, title, desc, gradient, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-dim)',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
      ...style,
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-dim)'}
    >
      <div style={{
        height: 80, background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <p style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-secondary)', marginBottom: 6 }}>
          {title}
        </p>
        <p style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}

function InfoCard({ children, accentColor = 'var(--accent-amber)', style = {} }) {
  return (
    <div style={{
      borderLeft: `2px solid ${accentColor}`,
      background: '#0d1420',
      padding: '16px 18px',
      display: 'flex', gap: 14, alignItems: 'flex-start',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionCard({ icon, title, children, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-mid)',
      padding: '20px',
      ...style,
    }}>
      {(icon || title) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
          color: 'var(--text-secondary)', marginBottom: 18,
        }}>
          {icon}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── needs useState so import here ───────────────────────────────────────────
import { useState } from 'react';

export default function Card({ variant = 'base', children, ...props }) {
  switch (variant) {
    case 'neural':   return <NeuralCard {...props}>{children}</NeuralCard>;
    case 'feature':  return <FeatureCard {...props} />;
    case 'info':     return <InfoCard {...props}>{children}</InfoCard>;
    case 'section':  return <SectionCard {...props}>{children}</SectionCard>;
    default:         return <BaseCard {...props}>{children}</BaseCard>;
  }
}

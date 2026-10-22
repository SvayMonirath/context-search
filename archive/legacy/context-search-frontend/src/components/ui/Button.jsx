// src/components/ui/Button.jsx
// All button variants used across the app.
// Usage: <Button variant="primary" onClick={...}>LABEL</Button>

const BASE = {
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.16em',
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};

const VARIANTS = {
  // Solid blue — primary actions (INITIALIZE, COMMIT)
  primary: {
    background: 'var(--accent-blue)',
    color: '#e8f0ff',
    fontSize: 12,
    padding: '12px 20px',
    hover: { background: '#5aadff' },
  },
  // Purple outline — important secondary (SYNC_DATA, CONNECT)
  purple: {
    background: 'rgba(168,85,247,0.15)',
    border: '1px solid rgba(168,85,247,0.4)',
    color: '#c084fc',
    fontSize: 10,
    padding: '10px 14px',
    hover: { background: 'rgba(168,85,247,0.28)' },
  },
  // Blue outline — confirmative secondary (SYNC NOW)
  blue: {
    background: 'rgba(74,158,255,0.15)',
    border: '1px solid rgba(74,158,255,0.4)',
    color: 'var(--accent-blue)',
    fontSize: 10,
    padding: '10px 14px',
    hover: { background: 'rgba(74,158,255,0.28)' },
  },
  // Ghost — neutral actions (EXPORT, DISCONNECT)
  ghost: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-mid)',
    color: 'var(--text-secondary)',
    fontSize: 10,
    padding: '10px 14px',
    hover: { borderColor: 'var(--accent-blue)', color: 'var(--text-primary)' },
  },
  // Danger — destructive actions (PURGE, DELETE)
  danger: {
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.35)',
    color: '#ef4444',
    fontSize: 10,
    padding: '10px 14px',
    hover: { background: 'rgba(239,68,68,0.24)' },
  },
  // Ghost danger — text-level danger (DELETE_PROFILE_PERMANENTLY)
  'ghost-danger': {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: 9,
    padding: '4px 0',
    hover: { color: '#ff6b6b' },
  },
  // Link — inline text button (Log in)
  link: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-blue)',
    fontSize: 10,
    padding: '2px 0',
    hover: { color: '#7cc4ff' },
  },
  // OAuth — third-party sign-in (Google)
  oauth: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border-mid)',
    color: 'var(--text-secondary)',
    fontSize: 13,
    padding: '12px 20px',
    hover: { borderColor: 'var(--accent-blue)', color: 'var(--text-primary)' },
  },
};

export default function Button({
  variant = 'ghost',
  children,
  onClick,
  fullWidth = false,
  style = {},
  disabled = false,
}) {
  const v = VARIANTS[variant] || VARIANTS.ghost;

  const handleEnter = (e) => {
    if (disabled) return;
    if (v.hover?.background)   e.currentTarget.style.background   = v.hover.background;
    if (v.hover?.borderColor)  e.currentTarget.style.borderColor  = v.hover.borderColor;
    if (v.hover?.color)        e.currentTarget.style.color        = v.hover.color;
  };

  const handleLeave = (e) => {
    e.currentTarget.style.background   = v.background || 'none';
    e.currentTarget.style.borderColor  = v.border ? v.border.split(' ').pop() : 'transparent';
    e.currentTarget.style.color        = v.color;
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        ...BASE,
        background:   v.background || 'none',
        border:       v.border || 'none',
        color:        v.color,
        fontSize:     v.fontSize || 11,
        padding:      v.padding || '8px 14px',
        width:        fullWidth ? '100%' : undefined,
        opacity:      disabled ? 0.45 : 1,
        cursor:       disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

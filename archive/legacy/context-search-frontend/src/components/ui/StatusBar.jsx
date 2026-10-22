// src/components/ui/StatusBar.jsx

export default function StatusBar({ left = [], right = '' }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 20px',
      borderTop: '1px solid var(--border-dim)',
      background: 'rgba(10,11,16,0.9)',
      fontSize: 9,
      letterSpacing: '0.12em',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {left.map((item, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {item.dot && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: item.dot,
                animation: 'pulse-dot 2s ease-in-out infinite',
                display: 'inline-block',
              }} />
            )}
            {item.icon && <span style={{ fontSize: 10 }}>{item.icon}</span>}
            {item.label}
          </span>
        ))}
      </div>
      <span>{right}</span>
    </div>
  );
}

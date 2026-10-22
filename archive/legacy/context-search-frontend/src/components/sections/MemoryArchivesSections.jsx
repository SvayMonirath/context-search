// src/components/sections/MemoryArchivesSections.jsx
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { TerminalIcon, SearchIcon, MailIcon, CodeIcon, ChartIcon, GlobeIcon, RefreshIcon, ClockIcon, GridIcon } from '../ui/Icons';

export const HISTORY = {
  TODAY: [
    { id: 1, icon: <TerminalIcon />, color: 'var(--accent-blue)',   text: 'Summarize meeting notes from Q3 Engineering Sync', time: '09:42 AM', sources: 12 },
    { id: 2, icon: <SearchIcon />,   color: 'var(--accent-purple)', text: 'Find documentation for Neural_HUD component schema', time: '08:15 AM', sources: 4  },
  ],
  YESTERDAY: [
    { id: 3, icon: <MailIcon />,     color: 'var(--accent-blue)',   text: 'Retrieve latest emails from DevOps regarding server migration', time: '15:30 PM', sources: 28 },
    { id: 4, icon: <CodeIcon />,     color: 'var(--accent-green)',  text: "Analyze repository 'Gamma-Prime' for security vulnerabilities", time: '11:20 AM', sources: 32 },
  ],
};

export function HistoryItem({ item }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '16px 20px',
      background: 'var(--bg-card)', border: '1px solid var(--border-dim)',
      marginBottom: 6, cursor: 'pointer', transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-dim)'}
    >
      <div style={{ width: 32, height: 32, flexShrink: 0, background: 'var(--bg-input)', border: '1px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
        {item.icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{item.text}</p>
        <div style={{ display: 'flex', gap: 14, fontSize: 9, letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ClockIcon /> {item.time}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-blue)' }}><GridIcon /> {item.sources} SOURCES</span>
        </div>
      </div>
    </div>
  );
}

export function StatsRow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 32, maxWidth: 620 }}>
      {/* Sync Metric */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: 12 }}>
          <span>SYNC_METRIC</span><ChartIcon />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>1,204</div>
        <div style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-dim)', marginBottom: 10 }}>TOTAL QUERIES</div>
        <div style={{ height: 3, background: 'var(--border-dim)' }}>
          <div style={{ height: '100%', width: '72%', background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))' }} />
        </div>
      </div>

      {/* Active Nodes */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: 12 }}>
          <span>ACTIVE_NODES</span><GlobeIcon />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>12</div>
        <div style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-dim)', marginBottom: 12 }}>CONNECTED SOURCES</div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < 4 ? 'var(--accent-purple)' : i < 7 ? 'var(--accent-blue)' : 'var(--border-dim)' }} />
          ))}
        </div>
      </div>

      {/* System Health */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', padding: '18px 20px' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: 12 }}>SYSTEM_HEALTH</div>
        <Badge variant="success" label="NOMINAL" style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.6 }}>Latency: 14ms</div>
        <Button variant="ghost" style={{ fontSize: 9, padding: '5px 10px' }}>
          <RefreshIcon /> RECALIBRATE
        </Button>
      </div>
    </div>
  );
}
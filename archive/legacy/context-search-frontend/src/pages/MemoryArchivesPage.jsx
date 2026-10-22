// src/pages/MemoryArchivesPage.jsx
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import StatusBar from '../components/ui/StatusBar';

const TerminalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
  </svg>
);
const SearchIcon2 = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const CodeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);
const ChartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
  </svg>
);

const HISTORY = {
  TODAY: [
    {
      id: 1, icon: <TerminalIcon />, color: 'var(--accent-blue)',
      text: 'Summarize meeting notes from Q3 Engineering Sync',
      time: '09:42 AM', sources: 12,
    },
    {
      id: 2, icon: <SearchIcon2 />, color: 'var(--accent-purple)',
      text: 'Find documentation for Neural_HUD component schema',
      time: '08:15 AM', sources: 4,
    },
  ],
  YESTERDAY: [
    {
      id: 3, icon: <MailIcon />, color: 'var(--accent-blue)',
      text: 'Retrieve latest emails from DevOps regarding server migration',
      time: '15:30 PM', sources: 28,
    },
    {
      id: 4, icon: <CodeIcon />, color: 'var(--accent-green)',
      text: "Analyze repository 'Gamma-Prime' for security vulnerabilities",
      time: '11:20 AM', sources: 32,
    },
  ],
};

function HistoryItem({ item }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '16px 20px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-dim)',
      marginBottom: 6,
      cursor: 'pointer',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hi)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-dim)'}
    >
      <div style={{
        width: 32, height: 32, flexShrink: 0,
        background: 'var(--bg-input)',
        border: '1px solid var(--border-mid)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: item.color,
      }}>
        {item.icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.4 }}>
          {item.text}
        </p>
        <div style={{ display: 'flex', gap: 14, fontSize: 9, letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {item.time}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-blue)' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            {item.sources} SOURCES
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ label }) {
  return (
    <div style={{
      display: 'inline-block',
      background: 'var(--bg-input)',
      border: '1px solid var(--border-mid)',
      padding: '3px 10px',
      fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-dim)',
      marginBottom: 14, marginTop: 8,
    }}>
      {label}
    </div>
  );
}

export default function MemoryArchivesPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '5px 18px', background: 'rgba(10,11,14,.95)', borderBottom: '1px solid var(--border-dim)' }}>
        Search History
      </div>
      <Navbar showSidebar />

      <div style={{ display: 'flex', flex: 1, alignItems: 'flex-start' }}>
        <Sidebar />

        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', marginLeft: 210 }}>
          {/* History list */}
          <div style={{ maxWidth: 620 }}>
            {Object.entries(HISTORY).map(([day, items]) => (
              <div key={day}>
                <SectionLabel label={day} />
                {items.map(item => <HistoryItem key={item.id} item={item} />)}
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 32, maxWidth: 620 }}>
            {/* Sync metric */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-dim)', padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: 12 }}>
                <span>SYNC_METRIC</span>
                <ChartIcon />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                1,204
              </div>
              <div style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-dim)', marginBottom: 12 }}>TOTAL QUERIES</div>
              <div style={{ height: 3, background: 'var(--border-dim)' }}>
                <div style={{ height: '100%', width: '72%', background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))' }} />
              </div>
              <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                {[80, 60, 90, 55, 70, 85, 65, 72].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: Math.max(3, h * 0.12), background: i > 5 ? 'var(--border-mid)' : 'var(--border-dim)' }} />
                ))}
              </div>
            </div>

            {/* Active nodes */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-dim)', padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: 12 }}>
                <span>ACTIVE_NODES</span>
                <GlobeIcon />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                12
              </div>
              <div style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-dim)', marginBottom: 12 }}>CONNECTED SOURCES</div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: i < 4 ? 'var(--accent-purple)' : i < 7 ? 'var(--accent-blue)' : 'var(--border-mid)',
                  }} />
                ))}
              </div>
            </div>

            {/* System health */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-dim)', padding: '18px 20px',
            }}>
              <div style={{ fontSize: 8, letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: 12 }}>
                SYSTEM_HEALTH
              </div>
              <div style={{
                display: 'inline-block',
                background: 'rgba(74,240,196,0.12)',
                border: '1px solid rgba(74,240,196,0.3)',
                padding: '3px 8px',
                fontSize: 9, letterSpacing: '0.14em', color: 'var(--accent-green)',
                marginBottom: 10,
              }}>
                NOMINAL
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.6 }}>
                Latency: 14ms
              </div>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: '1px solid var(--border-mid)',
                color: 'var(--text-dim)', fontFamily: 'var(--font-mono)',
                fontSize: 9, letterSpacing: '0.12em', padding: '5px 10px', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.color = 'var(--accent-blue)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
              >
                <RefreshIcon /> RECALIBRATE
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom status */}
    </div>
  );
}

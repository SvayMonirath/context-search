// src/components/sections/IntegrationsSections.jsx
// All sub-components that belong only to the Neural Links / Integrations page.

import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { SyncIcon, LinkIcon, SecurityIcon, LockIcon, DBIcon, ShieldOutlineIcon, DiamondIcon } from '../ui/Icons';

// ── Single integration service card ──────────────────────────────────────────
export function IntegrationCard({ name, icon, connected, lastSync, activeFilters, bridgeId, securityNote, onDisconnect, onSync, onConnect }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', padding: 20 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, background: 'var(--bg-input)',
            border: '1px solid var(--border-mid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {icon}
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
              {name}
            </h3>
            <Badge variant={connected ? 'live' : 'offline'} label={connected ? 'CONNECTED' : 'DISCONNECTED'} />
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Badge variant="dim" label="STRICTLY ISOLATED" style={{ marginBottom: 4, display: 'block' }} />
          <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>BRIDGE_ID: {bridgeId}</span>
        </div>
      </div>

      {/* Connected state */}
      {connected ? (
        <>
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-dim)', padding: '12px 16px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-dim)' }}>LAST SYNC EVENT</span>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{lastSync}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-dim)' }}>ACTIVE FILTERS</span>
              <span style={{ fontSize: 9, color: 'var(--accent-blue)' }}>{activeFilters}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <Button variant="ghost" style={{ flex: 1 }} onClick={onDisconnect}>DISCONNECT</Button>
            <Button variant="blue"  style={{ flex: 1 }} onClick={onSync}><SyncIcon size={11} /> SYNC NOW</Button>
          </div>
        </>
      ) : (
        <>
          <div style={{
            background: 'var(--bg-input)', border: '1px dashed var(--border-mid)',
            padding: '28px 16px', marginBottom: 14,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--border-mid)" strokeWidth="1.5">
              <path d="M3 15a4 4 0 0 0 4 4h9a5 5 0 0 0 1.8-9.7 7 7 0 0 0-13.3-2.4A4 4 0 0 0 3 15z"/>
            </svg>
            <p style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--text-muted)' }}>NO ACTIVE BRIDGE ESTABLISHED</p>
          </div>
          <Button variant="purple" fullWidth onClick={onConnect} style={{ marginBottom: 14 }}>
            <LinkIcon size={11} /> CONNECT ACCOUNT
          </Button>
        </>
      )}

      {/* Card footer */}
      <div style={{
        borderTop: '1px solid var(--border-dim)', paddingTop: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-muted)',
      }}>
        <span>{securityNote}</span>
        {connected ? <SecurityIcon size={11} /> : <LockIcon size={11} />}
      </div>
    </div>
  );
}

// ── Feature tiles row ─────────────────────────────────────────────────────────
export function FeatureTiles() {
  const tiles = [
    { icon: <DBIcon />,            title: 'LOCAL STORAGE',    desc: 'All sync data is encrypted with local keys.',        gradient: 'linear-gradient(135deg, #0d1a2e, #152035)' },
    { icon: <ShieldOutlineIcon />, title: 'PERMISSION GUARD', desc: 'Granular control over specific folder syncs.',       gradient: 'linear-gradient(135deg, #1a0d2e, #251535)' },
    { icon: <DiamondIcon />,       title: 'API INTEGRITY',    desc: 'Direct bridge connection, no middleware.',           gradient: 'linear-gradient(135deg, #2a1a08, #1e1408)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
      {tiles.map(t => (
        <Card key={t.title} variant="feature" {...t} />
      ))}
    </div>
  );
}

// src/components/sections/SystemConfigSections.jsx
import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import { PersonIcon, DBIcon, SunIcon, SecurityCheckIcon, WarningIcon } from '../ui/Icons';

export function ProfileIdentitySection({ displayName, setDisplayName }) {
  const [saved, setSaved] = useState(false);
  const commit = () => { 
    setSaved(true); 
    setTimeout(() => setSaved(false), 2000); 
  };

  return (
    <Card variant="section" icon={<PersonIcon size={13} />} title="PROFILE IDENTITY" style={{ marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
      {/* Fingerprint watermark */}
      <svg width="80" height="80" viewBox="0 0 100 100" fill="none" style={{ opacity: 0.05, position: 'absolute', right: 16, top: 10 }}>
        {[10,18,26,34,42].map((r, i) => (
          <path key={i} d={`M50 ${r} C${28+i*2} ${r} ${r} ${28+i*2} ${r} 50`} stroke="white" strokeWidth="2" fill="none"/>
        ))}
      </svg>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end', marginBottom: 14 }}>
        <Input label="DISPLAY NAME" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="CORE_USER_01" />
        <Input label="NEURAL ID" value="NX-8842-SYST" readOnly />
        <Button variant={saved ? 'blue' : 'blue'} onClick={commit} style={{ whiteSpace: 'nowrap' }}>
          {saved ? 'SAVED ✓' : 'COMMIT_CHANGES'}
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, letterSpacing: '0.12em', color: 'var(--accent-amber)' }}>
          <WarningIcon size={10} /> Danger Zone
        </span>
        <Button variant="ghost-danger">DELETE_PROFILE_PERMANENTLY</Button>
      </div>
    </Card>
  );
}

export function DataGovernanceSection() {
  return (
    <Card variant="section" icon={<DBIcon size={13} color="var(--text-secondary)" />} title="DATA GOVERNANCE">
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 3 }}>Neural Cache</p>
            <p style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5, maxWidth: 200 }}>Export your indexed memories into a portable JSON matrix.</p>
          </div>
          <Button variant="ghost" style={{ marginLeft: 12, whiteSpace: 'nowrap' }}>EXPORT_DATA</Button>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 3 }}>Purge History</p>
            <p style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5, maxWidth: 200 }}>Instant wipe of all localized search data and context history.</p>
          </div>
          <Button variant="danger" style={{ marginLeft: 12, whiteSpace: 'nowrap' }}>PURGE_SYST</Button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-dim)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-amber)' }} />
        Last backup: 2024-05-22 14:00 UTC
      </div>
    </Card>
  );
}

export function NeuralThemeSection() {
  const [theme, setTheme] = useState('ONYX_DIGITAL');
  const [glow, setGlow] = useState(64);
  const [highContrast, setHighContrast] = useState(false);

  return (
    <Card variant="section" icon={<SunIcon size={13} />} title="NEURAL THEME">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        {['ONYX_DIGITAL', 'PAPER_LIGHT'].map(t => (
          <button key={t} onClick={() => setTheme(t)} style={{
            padding: '14px 10px',
            background: theme === t ? 'rgba(74,158,255,0.1)' : 'var(--bg-input)',
            border: `1px solid ${theme === t ? 'var(--accent-blue)' : 'var(--border-mid)'}`,
            cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
          }}>
            <div style={{ width: 32, height: 20, background: t === 'ONYX_DIGITAL' ? '#111318' : '#f5f5f0', border: '1px solid var(--border-mid)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 16, height: 3, background: t === 'ONYX_DIGITAL' ? 'var(--accent-blue)' : '#888' }} />
            </div>
            <span style={{ fontSize: 8, letterSpacing: '0.12em', color: theme === t ? 'var(--text-primary)' : 'var(--text-dim)' }}>{t}</span>
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)', marginBottom: 8 }}>
          <span>Ambient Glow Intensity</span>
          <span style={{ color: 'var(--text-primary)' }}>{glow}%</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={glow} 
          onChange={e => setGlow(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent-blue)', cursor: 'pointer' }} 
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>High-Contrast HUD Mode</span>
        <button 
          onClick={() => setHighContrast(v => !v)} 
          style={{
            width: 36, height: 20, background: highContrast ? 'var(--accent-blue)' : 'var(--border-mid)',
            border: 'none', borderRadius: 10, cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
          }}
        >
          <span style={{ 
            position: 'absolute', 
            top: 2, 
            left: highContrast ? 18 : 2, 
            width: 16, height: 16, 
            borderRadius: '50%', 
            background: 'white', 
            transition: 'left 0.2s' 
          }} />
        </button>
      </div>
    </Card>
  );
}

export function IsolationNotice() {
  return (
    <Card variant="info" accentColor="rgba(74,158,255,0.5)" style={{ border: '1px solid rgba(74,158,255,0.2)' }}>
      <div style={{ width: 44, height: 44, flexShrink: 0, background: 'rgba(74,158,255,0.1)', border: '1px solid rgba(74,158,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SecurityCheckIcon size={20} color="var(--accent-blue)" />
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: 'var(--accent-blue)', marginBottom: 8 }}>ISOLATION PROTOCOL ALPHA</p>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
          Settings on this screen are strictly encapsulated. No data from <span style={{ color: 'var(--accent-blue)' }}>CORE_USER_01</span> leaks to shared neural repositories. Your local search index is encrypted using AES-256 and salt-derived keys stored in your browser's private vault.
        </p>
      </div>
    </Card>
  );
}
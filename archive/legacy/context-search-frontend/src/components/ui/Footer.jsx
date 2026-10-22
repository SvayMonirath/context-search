// src/components/ui/Footer.jsx
// All page footers in one place, selected by variant.
//
// variant="signup"   → signup page footer (Security & Privacy + Log in link)
// variant="signup-status" → the encrypted link status row on the signup card
// variant="dashboard"    → NODE_HASH / SYSTEM_LOAD / PROTOCOL_STABLE bar
// variant="profile"      → SYSTEM_LOAD + SERVER + copyright bar
// variant="memory"       → SYSTEM_LIVE / MEMORY / ENC bar
// variant="config"       → LATENCY + NEURAL LOAD + copyright bar
//
// Usage: <Footer variant="signup" onLogin={() => navigate('/profiles')} />

import { useNavigate } from 'react-router-dom';

// ─── Shared row wrapper ───────────────────────────────────────────────────────
function BarRow({ children, style = {} }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 20px',
      borderTop: '1px solid var(--border-dim)',
      background: 'rgba(10,11,14,0.9)',
      fontSize: 8, letterSpacing: '0.12em', color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Dot({ color = 'var(--accent-green)', pulse = false }) {
  return (
    <span style={{
      width: 5, height: 5, borderRadius: '50%',
      background: color, display: 'inline-block',
      animation: pulse ? 'pulse-dot 2s ease-in-out infinite' : 'none',
      marginRight: 5,
    }} />
  );
}

// ─── Individual footer variants ───────────────────────────────────────────────

function SignupFooter({ onLogin }) {
  return (
    <div style={{
      borderTop: '1px solid var(--border-dim)', paddingTop: 14,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em',
      fontFamily: 'var(--font-mono)',
    }}>
      <span>⊙ Security & Privacy Protocol</span>
      <button onClick={onLogin} style={{
        background: 'none', border: 'none',
        color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)',
        fontSize: 9, cursor: 'pointer', letterSpacing: '0.06em',
      }}>
        Log in
      </button>
    </div>
  );
}

function SignupStatusFooter() {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontSize: 8, letterSpacing: '0.1em', color: 'var(--text-muted)',
      paddingTop: 12, marginTop: 4, fontFamily: 'var(--font-mono)',
    }}>
      <span><Dot color="var(--accent-green)" pulse />ENCRYPTED_LINK: ACTIVE & LATENCY: 12MS</span>
      <span>v0.9.2-ALPHA</span>
    </div>
  );
}

function DashboardFooter({ left = [], right = '' }) {
  return (
    <BarRow>
      <div style={{ display: 'flex', gap: 20 }}>
        {left.map((item, i) => (
          <span key={i}>{item.dot && <Dot color={item.dot} />}{item.label}</span>
        ))}
      </div>
      <span>{right}</span>
    </BarRow>
  );
}

function ProfileFooter() {
  return (
    <div style={{ margin: '0 auto', maxWidth: 960, padding: '0 48px 40px' }}>
      <DashboardFooter
        left={[
          { dot: 'var(--accent-green)', label: 'SYSTEM_LOAD: 12%' },
          { label: '▣ SERVER: EDGE_NODE_09' },
        ]}
        right="© 2024 NEURAL_SEARCH_PROTOCOL  ▪ ▪ ▪"
      />
    </div>
  );
}

function MemoryFooter() {
  return (
    <BarRow>
      <div style={{ display: 'flex', gap: 16 }}>
        <span><Dot color="var(--accent-green)" />SYSTEM_LIVE &nbsp; V1.4.2_DELTA</span>
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <span>MEMORY: 4.2GB / 16GB</span>
        <span>ENC: AES-256</span>
        <span>05:43:28</span>
      </div>
    </BarRow>
  );
}

function ConfigFooter() {
  return (
    <BarRow>
      <div style={{ display: 'flex', gap: 16 }}>
        <span><Dot color="var(--accent-green)" />LATENCY: 12MS</span>
        <span><Dot color="var(--accent-blue)" />NEURAL LOAD: 4%</span>
      </div>
      <span>© 2024 CONTEXT_SEARCH_SYSTEMS // SECURE_NODE_129</span>
    </BarRow>
  );
}

function IntegrationsFooter() {
  return (
    <BarRow>
      <div style={{ display: 'flex', gap: 20 }}>
        <span>NODE_HASH &nbsp; 0xAF82...9931</span>
        <span>SYSTEM_LOAD &nbsp; 0.04 MS / 0PS</span>
      </div>
      <span>PROTOCOL_STABLE // NO_LEAKS_DETECTED</span>
    </BarRow>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default function Footer({ variant, onLogin }) {
  const navigate = useNavigate();

  switch (variant) {
    case 'signup':        return <SignupFooter onLogin={onLogin || (() => navigate('/profiles'))} />;
    case 'signup-status': return <SignupStatusFooter />;
    case 'profile':       return <ProfileFooter />;
    case 'memory':        return <MemoryFooter />;
    case 'config':        return <ConfigFooter />;
    case 'integrations':  return <IntegrationsFooter />;
    default:              return null;
  }
}

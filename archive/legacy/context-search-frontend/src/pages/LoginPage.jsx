// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../hook/authentication.hook';
import CornerBrackets from '../components/ui/CornerBrackets';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" stroke="#e8a04a" strokeWidth="1.5"/>
    <path d="M9 12l2 2 4-4" stroke="#e8a04a" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginUser } = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const handleLogin = async () => {
    await loginUser(email, password);
  }

  const inputStyle = (field) => ({
    width: '100%',
    padding: '12px 14px',
    background: 'var(--bg-input)',
    border: `1px solid ${focusedField === field ? 'var(--accent-blue)' : 'var(--border-dim)'}`,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    outline: 'none',
    letterSpacing: '0.05em',
    transition: 'border-color 0.2s',
    boxShadow: focusedField === field ? '0 0 0 2px rgba(74,158,255,0.08)' : 'none',
  });

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
    }}>
      <div className="animate-fade-up" style={{
        position: 'relative',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-dim)',
        width: 380,
        padding: '36px 32px 28px',
      }}>
        <CornerBrackets />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 10, letterSpacing: '0.18em', color: 'var(--accent-blue)',
          marginBottom: 10,
        }}>
          SYSTEM_INIT
          <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28, fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '0.02em', marginBottom: 6,
        }}>
          Initialize Neural Link
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.04em', marginBottom: 28 }}>
          Create your encrypted context environment.
        </p>
        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: 10, letterSpacing: '0.15em', color: 'var(--text-muted)',
          marginBottom: 22,
        }}>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-dim)', marginBottom: 6 }}>
            IDENTIFICATION (EMAIL)
          </label>
          <input
            type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="user@neural_link.arch"
            style={{ ...inputStyle('email'), '::placeholder': { color: 'var(--text-muted)' } }}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-dim)', marginBottom: 6 }}>
            SECURE PROTOCOL (PASSWORD)
          </label>
          <input
            type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="············"
            style={inputStyle('password')}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleLogin}
          style={{
            width: '100%', padding: '14px',
            background: 'var(--accent-blue)', border: 'none',
            color: '#e8f0ff', fontFamily: 'var(--font-mono)', fontSize: 13,
            letterSpacing: '0.18em', cursor: 'pointer',
            transition: 'all 0.2s', marginBottom: 20,
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#5aadff'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-blue)'}
        >
          LOGIN
        </button>

        {/* Privacy box */}
        <div style={{
          borderLeft: '2px solid var(--accent-amber)',
          background: '#131a21',
          padding: '12px 14px',
          marginBottom: 22,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <ShieldIcon />
          <div>
            <p style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--accent-amber)', marginBottom: 4 }}>PRIVACY_CORE_V4</p>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
              Independent memory isolation for every profile you create. Your neural data is encrypted at the edge.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--border-dim)', paddingTop: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em',
        }}>
          <span>⊙ Security &amp; Privacy Protocol</span>
          <button onClick={() => navigate('/register')} style={{
            background: 'none', border: 'none',
            color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)',
            fontSize: 10, cursor: 'pointer', letterSpacing: '0.06em',
          }}>Sign Up</button>
        </div>

        {/* Status */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 9, letterSpacing: '0.12em', color: 'var(--text-muted)',
          paddingTop: 14, marginTop: 6,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--accent-green)', display: 'inline-block',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }} />
            ENCRYPTED_LINK: ACTIVE &nbsp; LATENCY: 12MS
          </span>
          <span>v0.9.2-ALPHA</span>
        </div>
      </div>
    </div>
  );
}

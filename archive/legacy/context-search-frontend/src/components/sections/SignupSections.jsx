// src/components/sections/SignupSections.jsx
// All sub-components that belong only to the Signup page.
// Page just imports and assembles these.

import { GoogleIcon, SecurityCheckIcon } from '../ui/Icons';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Footer from '../ui/Footer';
import CornerBrackets from '../ui/CornerBrackets';

// ── The card shell ────────────────────────────────────────────────────────────
export function SignupCard({ children }) {
  return (
    <div className="animate-fade-up" style={{
      position: 'relative',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-dim)',
      width: 380, padding: '36px 32px 28px',
    }}>
      <CornerBrackets />
      {children}
    </div>
  );
}

// ── System init label + title ─────────────────────────────────────────────────
export function SignupHeader() {
  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 10, letterSpacing: '0.18em', color: 'var(--accent-blue)',
        marginBottom: 10,
      }}>
        SYSTEM_INIT
        <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
      </div>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
        color: 'var(--text-primary)', letterSpacing: '0.02em', marginBottom: 6,
      }}>
        Initialize Neural Link
      </h1>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.04em', marginBottom: 28 }}>
        Create your encrypted context environment.
      </p>
    </>
  );
}

// ── Google OAuth button ───────────────────────────────────────────────────────
export function GoogleSignupButton({ onClick }) {
  return (
    <Button variant="oauth" fullWidth onClick={onClick} style={{ marginBottom: 24, gap: 10 }}>
      <GoogleIcon /> Sign Up with Google
    </Button>
  );
}

// ── OR divider ────────────────────────────────────────────────────────────────
export function OrDivider() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      fontSize: 10, letterSpacing: '0.15em', color: 'var(--text-muted)',
      marginBottom: 22,
    }}>
      <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
      OR_MANUAL_ENTRY
      <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
    </div>
  );
}

// ── Email + password fields ───────────────────────────────────────────────────
export function SignupFields({ email, setEmail, password, setPassword }) {
  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <Input
          label="IDENTIFICATION (EMAIL)"
          type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="user@neural_link.arch"
        />
      </div>
      <div style={{ marginBottom: 20 }}>
        <Input
          label="SECURE PROTOCOL (PASSWORD)"
          type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="············"
        />
      </div>
    </>
  );
}

// ── Privacy notice box ────────────────────────────────────────────────────────
export function PrivacyNotice() {
  return (
    <div style={{
      borderLeft: '2px solid var(--accent-amber)',
      background: '#131a21', padding: '12px 14px',
      marginBottom: 22, display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <SecurityCheckIcon width={20} height={10} color="var(--accent-amber)" />
      <div>
        <p style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--accent-amber)', marginBottom: 4 }}>
          PRIVACY_CORE_V4
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          Independent memory isolation for every profile you create.
          Your neural data is encrypted at the edge.
        </p>
      </div>
    </div>
  );
}

// ── Re-export Footer for convenience ─────────────────────────────────────────
export { Footer };

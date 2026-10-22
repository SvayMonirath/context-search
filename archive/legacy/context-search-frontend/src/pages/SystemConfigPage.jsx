// src/pages/SystemConfigPage.jsx
import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';

const FingerprintBg = () => (
  <svg width="84" height="84" viewBox="0 0 100 100" fill="none" style={{ opacity: 0.04, position: 'absolute', right: 20, top: 16, pointerEvents: 'none' }}>
    <path d="M50 10 C28 10 10 28 10 50 C10 72 28 90 50 90" stroke="white" strokeWidth="1.5" fill="none"/>
    <path d="M50 18 C32 18 18 32 18 50 C18 68 32 82 50 82" stroke="white" strokeWidth="1.5" fill="none"/>
    <path d="M50 26 C36 26 26 36 26 50 C26 64 36 74 50 74" stroke="white" strokeWidth="1.5" fill="none"/>
    <path d="M50 34 C40 34 34 40 34 50 C34 60 40 66 50 66" stroke="white" strokeWidth="1.5" fill="none"/>
    <path d="M50 42 C44 42 42 46 42 50 C42 54 44 58 50 58" stroke="white" strokeWidth="1.5" fill="none"/>
  </svg>
);

export default function SystemConfigPage() {
  const [displayName, setDisplayName] = useState('CORE_USER_01');
  const [glowIntensity, setGlowIntensity] = useState(64);
  const [highContrast, setHighContrast] = useState(false);
  const [theme, setTheme] = useState('ONYX_DIGITAL');
  const [saved, setSaved] = useState(false);

  const handleCommit = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={styles.page}>
      {/* Top Banner Telemetry Bar */}
      <div style={styles.topTelemetry}>
        SYSTEM_PARAMETERS // CORE_NODE_PROT
      </div>
      <Navbar showSidebar />

      <div style={styles.shell}>
        <Sidebar />

        <main style={{ marginLeft: 260, ...styles.main }}>

          {/* PAGE HEADER */}
          <div style={styles.headerSection}>
            <div style={styles.headerRow}>
              <h1 style={styles.pageTitle}>SYSTEM_CONFIG</h1>
              <div style={styles.statusIndicator}>
                <span style={styles.statusPulse} />
                LIVE_MODE
              </div>
            </div>
            <p style={styles.pageSubtitle}>
              Configure your neural node and data isolation protocols. All operational adjustments remain localized and bound explicitly to the active matrix container profile [<span style={{ color: '#60a5fa' }}>CORE_USER_01</span>].
            </p>
          </div>

          {/* PROFILE IDENTITY (MAIN MODULE) */}
          <div style={styles.cardOuter}>
            <div style={styles.cardInner}>
              <FingerprintBg />

              <div style={styles.sectionHeader}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                PROFILE IDENTITY MANAGEMENT
              </div>

              <div style={styles.identityGrid}>
                <div>
                  <label style={styles.inputLabel}>DISPLAY_NAME</label>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value.toUpperCase())}
                    style={styles.textInput}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#222635'}
                  />
                </div>
                <div>
                  <label style={styles.inputLabel}>NEURAL_NODE_ID</label>
                  <input
                    value="NX-8842-SYST"
                    disabled
                    style={styles.disabledInput}
                  />
                </div>
                <div>
                  <button
                    onClick={handleCommit}
                    style={{
                      ...styles.commitBtn,
                      background: saved ? "rgba(74,222,128,0.04)" : "rgba(96,165,250,0.02)",
                      borderColor: saved ? "#22c55e" : "#3b82f6",
                      color: saved ? "#4ade80" : "#60a5fa",
                    }}
                  >
                    {saved ? 'DATA_COMMITTED ✓' : 'COMMIT_CHANGES'}
                  </button>
                </div>
              </div>

              <div style={styles.dangerStrip}>
                <span style={styles.warningTag}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  WARNING // DESTRUCTIVE ACTIONS
                </span>
                <button style={styles.inlineDestructBtn}>
                  DELETE_PROFILE_PERMANENTLY
                </button>
              </div>
            </div>
          </div>

          {/* TWO COLUMN INTERACTION MATRIX */}
          <div style={styles.splitGrid}>

            {/* COLUMN 1: DATA GOVERNANCE */}
            <div style={styles.cardOuter}>
              <div style={styles.cardInner}>
                <div style={styles.sectionHeader}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                  DATA GOVERNANCE PROTOCOLS
                </div>

                <div style={styles.governanceRow}>
                  <div>
                    <div style={styles.rowTitle}>Neural Cache Ingestion</div>
                    <div style={styles.rowDesc}>Export completely compiled memory logs to local JSON file structures.</div>
                  </div>
                  <button style={styles.panelActionBtn}>EXPORT_MATRIX</button>
                </div>

                <div style={styles.governanceRow}>
                  <div>
                    <div style={{ ...styles.rowTitle, color: '#f87171' }}>Index Core Purge</div>
                    <div style={styles.rowDesc}>Instant zero-fill wipe of localized active index paths and configuration.</div>
                  </div>
                  <button style={styles.panelDestructBtn}>WIPE_INDEX</button>
                </div>

                <div style={styles.backupLog}>
                  <span style={styles.backupDot} />
                  LAST_COMPREHENSIVE_BACKUP: 2026-05-22 14:00 UTC
                </div>
              </div>
            </div>

            {/* COLUMN 2: NEURAL DESIGN HUD */}
            <div style={styles.cardOuter}>
              <div style={styles.cardInner}>
                <div style={styles.sectionHeader}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                  HUD VISUAL SPECIFICATION
                </div>

                {/* Theme Selector Tiles */}
                <div style={styles.themeToggleGrid}>
                  {['ONYX_DIGITAL', 'PAPER_LIGHT'].map(t => {
                    const isSelected = theme === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        style={{
                          ...styles.themeTileBtn,
                          background: isSelected ? 'rgba(59,130,246,0.03)' : '#141722',
                          borderColor: isSelected ? '#3b82f6' : '#222635'
                        }}
                      >
                        <div style={{
                          ...styles.themeMiniature,
                          background: t === 'ONYX_DIGITAL' ? '#0c0d12' : '#f5f5f0',
                          borderColor: isSelected ? 'rgba(59,130,246,0.3)' : '#1c202e'
                        }}>
                          <div style={{
                            width: 14,
                            height: 2,
                            background: t === 'ONYX_DIGITAL' ? '#3b82f6' : '#64748b'
                          }} />
                        </div>
                        <span style={{
                          fontSize: 10,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? '#ffffff' : '#4e556e'
                        }}>{t}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tactile Range Slider Input Container */}
                <div style={styles.controlRow}>
                  <div style={styles.controlMeta}>
                    <span>AMBIENT_GLOW_INTENSITY</span>
                    <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{glowIntensity}%</span>
                  </div>
                  <div style={styles.sliderWrapper}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={glowIntensity}
                      onChange={e => setGlowIntensity(Number(e.target.value))}
                      style={styles.systemSlider}
                    />
                  </div>
                </div>

                {/* Cyber Toggle Checkbox Switch */}
                <div style={styles.toggleRow} onClick={() => setHighContrast(v => !v)}>
                  <div>
                    <div style={styles.rowTitle}>High-Contrast HUD Architecture</div>
                    <div style={styles.rowDesc}>Force high-visibility vector bounds across low-tier displays.</div>
                  </div>
                  <div style={{
                    ...styles.checkboxFrame,
                    borderColor: highContrast ? '#3b82f6' : '#222635',
                    background: highContrast ? 'rgba(59,130,246,0.08)' : 'transparent'
                  }}>
                    {highContrast && <div style={styles.checkboxMarker} />}
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* PRIVACY ENCAPSULATION BANNER */}
          <div style={styles.isolationBanner}>
            <div style={styles.isolationIconBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div>
              <div style={styles.isolationTitle}>ISOLATION_PROTOCOL_ALPHA // ENCRYPTED_STATION</div>
              <p style={styles.isolationDesc}>
                Runtime variables edited within this secure container are strictly sandboxed. No profile parameter sets or local telemetry will leak outward to public index clusters. Local system storage keys are salted, signed, and locked behind localized secure context architecture.
              </p>
            </div>
          </div>

        </main>
      </div>

      {/* SYSTEM BOTTOM MATRIX INFOBAR */}
      <footer style={styles.footer}>
        <div style={styles.telemetryCluster}>
          <span style={styles.telemetryItem}>
            <span style={{ ...styles.indicatorDot, background: '#4ade80' }} />
            LATENCY: 12MS // ONLINE
          </span>
          <span style={styles.telemetryItem}>
            <span style={{ ...styles.indicatorDot, background: '#60a5fa' }} />
            NEURAL ENGINE LOAD: 4%
          </span>
        </div>
        <span>© 2026 CONTEXT_SEARCH_SYSTEMS // LOCAL_NODE_129</span>
      </footer>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   STYLES: SYSTEM SPECIFICATION PALETTE
────────────────────────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#0c0d12',
    color: '#ffffff',
    fontFamily: 'var(--font-mono), monospace',
  },

  topTelemetry: {
    fontSize: 10,
    color: '#3d4357',
    letterSpacing: '0.15em',
    padding: '6px 24px',
    background: '#08090d',
    borderBottom: '1px solid #171921',
    fontWeight: 'bold',
  },

  shell: {
    display: 'flex',
    flex: 1,
  },

  main: {
    flex: 1,
    padding: "40px 48px",
    boxSizing: "border-box",
  },

  headerSection: {
    marginBottom: 32,
  },

  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 6,
  },

  pageTitle: {
    fontFamily: 'var(--font-display), monospace',
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: '0.25em',
    color: '#ffffff',
    margin: 0,
  },

  statusIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 9,
    letterSpacing: '0.12em',
    color: '#4ade80',
    background: 'rgba(74,222,128,0.03)',
    border: '1px solid rgba(74,222,128,0.15)',
    padding: '3px 8px',
  },

  statusPulse: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#4ade80',
  },

  pageSubtitle: {
    fontSize: 11,
    color: '#4e556e',
    lineHeight: 1.6,
    maxWidth: 640,
    margin: 0,
    letterSpacing: '0.02em',
  },

  /* GEOMETRIC CYBER CARD BOUNDS */
  cardOuter: {
    background: '#0f111a',
    border: '1px solid #1c202e',
    padding: 2,
    marginBottom: 24,
  },

  cardInner: {
    padding: '24px 24px',
    background: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.15em',
    color: '#ffffff',
    marginBottom: 24,
    borderBottom: '1px solid #171921',
    paddingBottom: 12,
  },

  identityGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr auto',
    gap: 16,
    alignItems: 'end',
    marginBottom: 20,
  },

  inputLabel: {
    display: 'block',
    fontSize: 9,
    letterSpacing: '0.15em',
    color: '#4e556e',
    marginBottom: 8,
    fontWeight: '700',
  },

  textInput: {
    width: '100%',
    padding: '10px 14px',
    background: '#08090d',
    border: '1px solid #222635',
    color: '#ffffff',
    fontFamily: 'inherit',
    fontSize: 12,
    outline: 'none',
    letterSpacing: '0.05em',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
  },

  disabledInput: {
    width: '100%',
    padding: '10px 14px',
    background: '#0b0c10',
    border: '1px solid #151822',
    color: '#343a4e',
    fontFamily: 'inherit',
    fontSize: 12,
    letterSpacing: '0.05em',
    cursor: 'not-allowed',
    boxSizing: 'border-box',
  },

  commitBtn: {
    padding: '11px 24px',
    border: '1px solid',
    fontFamily: 'inherit',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },

  dangerStrip: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTop: '1px solid #1c202e',
  },

  warningTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 9,
    letterSpacing: '0.12em',
    color: '#fbbf24',
    fontWeight: 'bold',
  },

  inlineDestructBtn: {
    background: 'none',
    border: 'none',
    color: '#f87171',
    fontFamily: 'inherit',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 0.15s ease',
  },

  splitGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
    marginBottom: 24,
  },

  governanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: '#08090d',
    border: '1px solid #141722',
    marginBottom: 12,
  },

  rowTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: '0.02em',
  },

  rowDesc: {
    fontSize: 10,
    color: '#4e556e',
    lineHeight: '1.4',
  },

  panelActionBtn: {
    padding: '6px 12px',
    background: '#141722',
    border: '1px solid #222635',
    color: '#8ba2cb',
    fontFamily: 'inherit',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: '0.08em',
    cursor: 'pointer',
  },

  panelDestructBtn: {
    padding: '6px 12px',
    background: 'rgba(239,68,68,0.03)',
    border: '1px solid #ef4444',
    color: '#f87171',
    fontFamily: 'inherit',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: '0.08em',
    cursor: 'pointer',
  },

  backupLog: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    background: '#06070a',
    border: '1px solid #12141d',
    fontSize: 9,
    letterSpacing: '0.08em',
    color: '#4e556e',
    marginTop: 18,
  },

  backupDot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: '#eaa84e',
  },

  themeToggleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 20,
  },

  themeTileBtn: {
    padding: '12px',
    border: '1px solid',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    transition: 'all 0.15s ease',
  },

  themeMiniature: {
    width: 24,
    height: 16,
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  controlRow: {
    background: '#08090d',
    border: '1px solid #141722',
    padding: '14px 16px',
    marginBottom: 12,
  },

  controlMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#ffffff',
    letterSpacing: '0.08em',
    marginBottom: 10,
    fontWeight: '700',
  },

  sliderWrapper: {
    display: 'flex',
    alignItems: 'center',
  },

  systemSlider: {
    width: '100%',
    accentColor: '#3b82f6',
    background: '#141722',
    height: 3,
    cursor: 'pointer',
    outline: 'none',
  },

  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: '#08090d',
    border: '1px solid #141722',
    cursor: 'pointer',
  },

  checkboxFrame: {
    width: 16,
    height: 16,
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },

  checkboxMarker: {
    width: 8,
    height: 8,
    background: '#3b82f6',
  },

  /* SECURITY BANNER */
  isolationBanner: {
    background: '#090e17',
    border: '1px solid rgba(59,130,246,0.15)',
    padding: '20px 24px',
    display: 'flex',
    gap: 20,
    alignItems: 'flex-start',
  },

  isolationIconBox: {
    width: 40,
    height: 40,
    flexShrink: 0,
    background: 'rgba(59,130,246,0.03)',
    border: '1px solid rgba(59,130,246,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  isolationTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: '0.12em',
    color: '#60a5fa',
    marginBottom: 6,
  },

  isolationDesc: {
    fontSize: 11,
    color: '#4e556e',
    lineHeight: '1.6',
    margin: 0,
  },

  /* FOOTER */
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 24px',
    borderTop: '1px solid #171921',
    background: '#08090d',
    fontSize: 9,
    letterSpacing: '0.1em',
    color: '#3d4357',
    fontWeight: '600',
  },

  telemetryCluster: {
    display: 'flex',
    gap: 20,
  },

  telemetryItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },

  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
  },
};

// src/components/layout/Navbar.jsx
import { useNavigate, useLocation } from 'react-router-dom';

const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const ArchiveIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
  </svg>
);

const LinkIcon2 = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const ConfigIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const BellIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const SyncIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
  </svg>
);

export default function Navbar({ showSidebar = false }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentProfileId = localStorage.getItem('currentProfileId');
  const currentProfileType = localStorage.getItem('currentProfileType') || 'STANDARD';

  // const NAV_TABS = [
  //   { label: 'OMNI-SEARCH', path: `/dashboard/omni-search?profileId=${currentProfileId}&profileType=${currentProfileType}`, pattern: '/omni-search', icon: <SearchIcon /> },
  //   { label: 'NEURAL-LINKS', path: `/dashboard/neural-links?profileId=${currentProfileId}&profileType=${currentProfileType}`, pattern: '/neural-links', icon: <LinkIcon2 /> },
  //   { label: 'SYSTEM-CONFIG', path: `/dashboard/system-config?profileId=${currentProfileId}&profileType=${currentProfileType}`, pattern: '/system-config', icon: <ConfigIcon /> },
  //   { label: 'DATA-CONTROL', path: `/dashboard/data-control?profileId=${currentProfileId}&page=1&limit=75`, pattern: '/data-control', icon: <ArchiveIcon /> },
  // ];

  const NAV_TABS = currentProfileType === 'STANDARD' ? [
    { label: 'OMNI-SEARCH', path: `/dashboard/omni-search?profileId=${currentProfileId}&profileType=${currentProfileType}`, pattern: '/omni-search', icon: <SearchIcon /> },
    { label: 'NEURAL-LINKS', path: `/dashboard/neural-links?profileId=${currentProfileId}&profileType=${currentProfileType}`, pattern: '/neural-links', icon: <LinkIcon2 /> },
    { label: 'SYSTEM-CONFIG', path: `/dashboard/system-config?profileId=${currentProfileId}&profileType=${currentProfileType}`, pattern: '/system-config', icon: <ConfigIcon /> },
    { label: 'DATA-CONTROL', path: `/dashboard/data-control?profileId=${currentProfileId}&page=1&limit=75`, pattern: '/data-control', icon: <ArchiveIcon /> },
  ] : [
    { label: 'OMNI-SEARCH', path: `/dashboard/omni-search?profileId=${currentProfileId}&profileType=${currentProfileType}`, pattern: '/omni-search', icon: <SearchIcon /> },
    { label: 'NEURAL-LINKS', path: `/dashboard/neural-links?profileId=${currentProfileId}&profileType=${currentProfileType}`, pattern: '/neural-links', icon: <LinkIcon2 /> },
    { label: 'SYSTEM-CONFIG', path: `/dashboard/system-config?profileId=${currentProfileId}&profileType=${currentProfileType}`, pattern: '/system-config', icon: <ConfigIcon /> },
  ]


  const activeTab = NAV_TABS.find(tab => pathname.includes(tab.pattern))?.label || null;

  return (
    <nav style={styles.navbar}>
      {/* Brand Title Panel */}
      <div
        style={styles.brand}
        onClick={() => navigate('/profiles')}
      >
        CONTEXT_SEARCH <span style={styles.brandTicker}>// V2.06</span>
      </div>

      {/* Primary Tab Navigation Grid */}
      <div style={styles.tabContainer}>
        {NAV_TABS.map(tab => {
          const isActive = activeTab === tab.label;

          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              style={{
                ...styles.tabButton,
                color: isActive ? "#ffffff" : "#4e556e",
                background: isActive ? "#131620" : "transparent",
                borderColor: isActive ? "#282f42" : "transparent",
                fontWeight: isActive ? "700" : "500",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#a3a9be";
                  e.currentTarget.style.borderColor = "#1c202e";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#4e556e";
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
            >
              <span style={{ display: "flex", alignItems: "center" }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* Telemetry Actions + Account Hub */}
      <div style={styles.rightCluster}>
        <button
          style={styles.iconSystemBtn}
          title="System Logs"
          onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={e => e.currentTarget.style.color = '#4e556e'}
        >
          <BellIcon />
        </button>

        <button
          style={styles.iconSystemBtn}
          title="Sync Parameters"
          onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={e => e.currentTarget.style.color = '#4e556e'}
        >
          <SyncIcon />
        </button>

        <span style={styles.divider} />

        {showSidebar ? (
          <div style={{ border: "1px solid #1f2330", padding: 2 }}>
            <button
              onClick={() => {
                navigate('/profiles');
                localStorage.removeItem("currentProfileId");
              }}
              style={styles.profileSwitchBtn}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#1c2030';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#141722';
                e.currentTarget.style.color = '#8ba2cb';
              }}
            >
              <div style={styles.avatarMini}>A</div>
              <span style={{ fontSize: 10, fontWeight: "700" }}>PROFILE_SWITCH</span>
            </button>
          </div>
        ) : (
          <div
            style={styles.avatarActive}
            onClick={() => navigate('/profiles')}
            title="Manage Profiles"
          >
            <div style={{ fontSize: 11, fontWeight: "bold", color: "#0c0d12" }}>A</div>
          </div>
        )}
      </div>
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────
   STYLES: SYSTEM SPECIFICATION PALETTE
────────────────────────────────────────────────────────────── */
const styles = {
  navbar: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    height: 60, // Sized dynamically for aligned row elements
    borderBottom: '1px solid #171921',
    background: '#0c0d12', // Pure deep cyber-palette background
    position: 'sticky',
    top: 0,
    zIndex: 100,
    fontFamily: 'var(--font-mono), monospace',
    boxSizing: 'border-box',
  },

  brand: {
    fontFamily: 'var(--font-display), monospace',
    fontWeight: 800,
    fontSize: 14,
    letterSpacing: '0.2em',
    color: '#ffffff',
    cursor: 'pointer',
    minWidth: 200,
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },

  brandTicker: {
    fontSize: 10,
    color: '#2d3247',
    fontWeight: "500",
    letterSpacing: "0.05em"
  },

  tabContainer: {
    display: 'flex',
    gap: 4,
    alignItems: 'center'
  },

  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: '1px solid transparent',
    fontFamily: 'inherit',
    fontSize: 11,
    letterSpacing: '0.12em',
    cursor: 'pointer',
    padding: '8px 14px',
    boxSizing: 'border-box',
    transition: 'all 0.15s ease-in-out',
  },

  rightCluster: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },

  iconSystemBtn: {
    background: 'none',
    border: 'none',
    color: '#4e556e',
    cursor: 'pointer',
    padding: 6,
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.15s ease'
  },

  divider: {
    width: 1,
    height: 16,
    background: '#1c202e',
    margin: '0 4px'
  },

  profileSwitchBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#141722',
    border: '1px solid #282f44',
    color: '#788cb5',
    fontFamily: 'inherit',
    letterSpacing: '0.12em',
    padding: '6px 14px 6px 8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  avatarMini: {
    width: 16,
    height: 16,
    background: '#8ba2cb',
    color: '#0c0d12',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 9,
    fontWeight: "800"
  },

  avatarActive: {
    width: 26,
    height: 26,
    background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #0c0d12',
    boxShadow: '0 0 0 1px #282f42' // sharp twin cyber-ring
  }
};

// src/components/sections/ProfileSections.jsx
// All sub-components that belong only to the Profile Selection page.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { BriefcaseIcon, PersonIcon, PlusIcon, MailIcon, CloudIcon, PlayIcon, MusicIcon, CheckIcon } from '../ui/Icons';

// ── Single profile card ───────────────────────────────────────────────────────
export function ProfileCard({ profile }) {
  const navigate = useNavigate();

  const AppIcon = ({ icon }) => (
    <div style={{
      width: 22, height: 22,
      border: '1px solid var(--border-mid)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-dim)', background: 'var(--bg-input)',
    }}>
      {icon}
    </div>
  );

  return (
    <Card variant="neural" onClick={() => navigate('/dashboard/omni-search')}>
      {/* Type badge */}
      <Badge variant="dim" label={profile.type.toUpperCase()} style={{
        position: 'absolute', top: 14, right: 14,
      }} />

      {/* Icon */}
      <div style={{
        width: 52, height: 52,
        border: '1px solid var(--border-bright)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent-blue)', marginBottom: 16, background: 'var(--bg-input)',
      }}>
        {profile.type === 'workspace' ? <BriefcaseIcon /> : <PersonIcon />}
      </div>

      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        {profile.name}
      </h3>
      <p style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: 20 }}>
        Last Sync: {profile.lastSync}
      </p>

      {/* App icons + progress */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
        {profile.apps.map((icon, i) => <AppIcon key={i} icon={icon} />)}
        <div style={{ flex: 1, height: 2, background: 'var(--border-dim)', position: 'relative' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${profile.progress}%`,
            background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))',
          }} />
        </div>
      </div>

      {/* Sync status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Badge variant="live" label="SYNC_COMPLETE" />
        <CheckIcon />
      </div>

      <Button variant="ghost" fullWidth>INITIALIZE_PROFILE</Button>
    </Card>
  );
}

// ── Create new profile card ───────────────────────────────────────────────────
export function CreateProfileCard() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px dashed ${hovered ? 'var(--accent-blue)' : 'var(--border-mid)'}`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.2s', minHeight: 260,
        background: hovered ? 'rgba(74,158,255,0.03)' : 'transparent',
      }}
    >
      <div style={{
        width: 52, height: 52,
        border: `1px solid ${hovered ? 'var(--accent-blue)' : 'var(--border-mid)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hovered ? 'var(--accent-blue)' : 'var(--text-dim)',
        marginBottom: 16, transition: 'all 0.2s',
      }}>
        <PlusIcon />
      </div>
      <h3 style={{
        fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
        color: hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
        marginBottom: 6, transition: 'color 0.2s',
      }}>
        Create New Profile
      </h3>
      <p style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--text-dim)' }}>
        ALLOCATE_NEURAL_SLOT
      </p>
    </div>
  );
}

// ── Profile data ──────────────────────────────────────────────────────────────
export const PROFILES = [
  { id: 1, name: 'Work',     type: 'workspace', lastSync: '14:32:01 UTC', apps: [<MailIcon size={12} />, <CloudIcon size={12} />], progress: 78 },
  { id: 2, name: 'Personal', type: 'personal',  lastSync: '09:12:44 UTC', apps: [<PlayIcon size={12} />, <MusicIcon size={12} />], progress: 55 },
];

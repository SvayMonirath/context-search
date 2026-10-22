// src/components/sections/OmniSearchSections.jsx
import { useRef, useEffect } from 'react';

export const INITIAL_MESSAGES = [
  {
    id: 1, type: 'user',
    text: 'Did someone mention plans for Saturday?',
    time: '10:42:01',
  },
  {
    id: 2, type: 'ai',
    text: 'Yes, I found two references to Saturday plans in your work communications:',
    sources: [
      { service: 'GMAIL', dot: '#4a9eff', title: 'Subject: Project Phoenix Sync', excerpt: '"Let\'s move the final sprint review to Saturday morning at 10 AM if the server migration..."' },
      { service: 'TELEGRAM', dot: '#a855f7', title: 'From: Sarah (Lead Engineer)', excerpt: '"Saturday hiking after the deployment? Thinking Mount Diablo at 1 PM."' },
    ],
    note: 'Note: There is a potential schedule conflict between the 10 AM review and the 1 PM hike due to commute time.',
    time: '10:42:03',
    analysisTime: '0.842s',
  },
];

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const ExtLinkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

export function UserMessage({ msg }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
      <div style={{
        background: '#1a2235',
        border: '1px solid var(--border-mid)',
        padding: '10px 16px',
        maxWidth: '65%',
        fontSize: 13,
        color: 'var(--text-primary)',
        lineHeight: 1.5,
      }}>
        {msg.text}
      </div>
    </div>
  );
}

export function AiMessage({ msg }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 14px', background: 'var(--bg-input)',
        borderTop: '1px solid var(--border-mid)',
        borderLeft: '1px solid var(--border-mid)',
        borderRight: '1px solid var(--border-mid)',
        fontSize: 9, letterSpacing: '0.14em',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)' }} />
          AI_COPROCESSOR_LINK
        </span>
        <span style={{ color: 'var(--text-muted)' }}>VER_4.2.0</span>
      </div>

      <div style={{ border: '1px solid var(--border-mid)', background: 'var(--bg-card)', padding: '16px' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>
          {msg.text}
        </p>

        {msg.sources && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {msg.sources.map((src, i) => (
              <div key={i} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-mid)', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, letterSpacing: '0.14em', color: src.dot }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: src.dot }} />
                    {src.service}
                  </span>
                  <ExtLinkIcon />
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, fontFamily: 'var(--font-display)' }}>
                  {src.title}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5 }}>{src.excerpt}</p>
              </div>
            ))}
          </div>
        )}

        {msg.note && (
          <p style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic', lineHeight: 1.6 }}>
            {msg.note}
          </p>
        )}
      </div>

      {msg.analysisTime && (
        <div style={{ fontSize: 9, letterSpacing: '0.12em', color: 'var(--text-muted)', marginTop: 6 }}>
          ANALYSIS_COMPLETE // {msg.analysisTime}
        </div>
      )}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div style={{ border: '1px solid var(--border-mid)', background: 'var(--bg-card)', padding: '14px 16px', marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {[0,1,2].map(i => (
          <span key={i} style={{
            width: 5, height: 5, borderRadius: '50%',
            background: 'var(--accent-blue)',
            animation: `blink 1.2s ${i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
        <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.14em', marginLeft: 8 }}>
          PROCESSING_QUERY...
        </span>
      </div>
    </div>
  );
}

export function ChatInput({ input, setInput, onSend }) {
  return (
    <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-dim)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        border: '1px solid var(--border-mid)',
        background: 'var(--bg-input)',
        padding: '0 14px',
      }}>
        <span style={{ fontSize: 9, letterSpacing: '0.12em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          QUERY_SYSTEM &gt;
        </span>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSend()}
          placeholder="Type your command or search query..."
          style={{
            flex: 1, background: 'none', border: 'none',
            color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
            fontSize: 12, padding: '13px 0', outline: 'none',
            letterSpacing: '0.04em',
          }}
        />
        <button onClick={onSend} style={{
          background: 'none', border: 'none',
          color: input.trim() ? 'var(--accent-blue)' : 'var(--text-muted)',
          cursor: 'pointer', padding: '6px',
        }}>
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

export function RightPanel() {
  return (
    <div style={{ width: 180, borderLeft: '1px solid var(--border-dim)', padding: '20px 14px', background: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Active Context */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: 10 }}>
          <span>ACTIVE_CONTEXT</span>
          <span style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
            SYNCING...
          </span>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-mid)', padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 24, height: 24, background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>💼</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>WORK_PROFILE</span>
          </div>
          <div style={{ fontSize: 8, color: 'var(--text-muted)', lineHeight: 1.6, letterSpacing: '0.08em' }}>
            ENCRYPTION: AES_256_ACTIVE<br />NODE_US_EAST_CLUSTER_01
          </div>
        </div>
      </div>

      {/* Integrated Modules */}
      <div>
        <div style={{ fontSize: 8, letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: 10 }}>INTEGRATED_MODULES</div>
        {[
          { name: 'GMAIL', status: 'LIVE', color: 'var(--accent-blue)' },
          { name: 'TELEGRAM', status: 'LIVE', color: 'var(--accent-purple)' },
          { name: 'JIRA', status: 'LINK_OFFLINE', color: 'var(--text-muted)' },
        ].map(mod => (
          <div key={mod.name} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 10px', border: '1px solid var(--border-dim)', background: 'var(--bg-input)', marginBottom: 4,
          }}>
            <span style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>{mod.name}</span>
            <span style={{ fontSize: 7, letterSpacing: '0.12em', color: mod.color }}>
              {mod.status === 'LIVE' && <span style={{ width: 4, height: 4, borderRadius: '50%', background: mod.color, marginRight: 3 }} />}
              {mod.status}
            </span>
          </div>
        ))}
      </div>

      {/* Neural Load */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 8 }}>
          <span>NEURAL_LOAD</span>
          <span style={{ color: 'var(--text-dim)' }}>64%</span>
        </div>
        <div style={{ height: 3, background: 'var(--border-dim)', marginBottom: 4 }}>
          <div style={{ height: '100%', width: '64%', background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))' }} />
        </div>
      </div>
    </div>
  );
}
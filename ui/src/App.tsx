import { useState, useEffect, FormEvent } from 'react';
import { 
  Search, Shield, Mail, MessageSquare, 
  X, Lock, Unlock, FileText, Copy, Check,
  HardDrive, Plus, Database, BookOpen, Key,
  AlertCircle, ArrowRight
} from 'lucide-react';

// Dynamic Tauri IPC invoke wrapper with error recovery
async function tauriInvoke<T>(cmd: string, args?: Record<string, any>): Promise<T> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<T>(cmd, args);
  } catch (err) {
    console.warn(`[Context Vault IPC] ${cmd} call failed`, err);
    throw err;
  }
}

type LockStatus = 'loading' | 'uninitialized' | 'locked' | 'unlocked';

export default function App() {
  // Authentication & Vault Encryption State
  const [lockStatus, setLockStatus] = useState<LockStatus>('loading');
  const [passphrase, setPassphrase] = useState<string>('');
  const [confirmPassphrase, setConfirmPassphrase] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Application Navigation & Query State
  const [activeScreen, setActiveScreen] = useState<'main' | 'hud' | 'settings'>('main');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [synthesis, setSynthesis] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [stats, setStats] = useState<{ total_messages: number; storage_kb: number; sources_count: number } | null>(null);
  const [piiLogs, setPiiLogs] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [copiedCitation, setCopiedCitation] = useState<boolean>(false);

  // Active connector configuration states
  const [activeConnectorTab, setActiveConnectorTab] = useState<'obsidian' | 'gmail' | 'telegram' | 'notion'>('obsidian');
  const [obsidianPath, setObsidianPath] = useState<string>('');
  const [gmailToken, setGmailToken] = useState<string>('');
  const [telegramPath, setTelegramPath] = useState<string>('');
  const [notionKey, setNotionKey] = useState<string>('');

  // Refresh vault storage telemetry and PII audit log
  const refreshStats = () => {
    tauriInvoke<any>('get_vault_stats')
      .then(s => setStats(s))
      .catch(() => {});

    tauriInvoke<string[]>('get_pii_audit_log')
      .then(logs => setPiiLogs(logs))
      .catch(() => {});
  };

  // Load connectors configuration
  const loadConnectorsConfig = () => {
    tauriInvoke<any>('get_connectors_config')
      .then(cfg => {
        if (cfg) {
          if (cfg.obsidian_path) setObsidianPath(cfg.obsidian_path);
          if (cfg.gmail_token) setGmailToken(cfg.gmail_token);
          if (cfg.telegram_path) setTelegramPath(cfg.telegram_path);
          if (cfg.notion_api_key) setNotionKey(cfg.notion_api_key);
        }
      })
      .catch(() => {});
  };

  // Check vault lock state on startup
  const checkLockState = async () => {
    try {
      const res = await tauriInvoke<{ status: 'Uninitialized' | 'Locked' | 'Unlocked'; is_initialized: boolean }>('get_vault_lock_state');
      if (res.status === 'Uninitialized' || !res.is_initialized) {
        setLockStatus('uninitialized');
      } else if (res.status === 'Locked') {
        setLockStatus('locked');
      } else {
        setLockStatus('unlocked');
        refreshStats();
        loadConnectorsConfig();
      }
    } catch {
      // In web-only preview mode, default to uninitialized to allow onboarding walkthrough
      setLockStatus('uninitialized');
    }
  };

  useEffect(() => {
    checkLockState();
  }, []);

  // Live search and factual synthesis when unlocked
  useEffect(() => {
    if (lockStatus !== 'unlocked') return;

    const filterParam = activeFilter === 'All' ? null : activeFilter;

    tauriInvoke<any[]>('search_vault', { 
      query, 
      filter: filterParam 
    })
      .then(docs => {
        setResults(docs);
        if (docs.length > 0 && !docs.some(d => d.id === selectedDocId)) {
          setSelectedDocId(docs[0].id);
        }
      })
      .catch(() => {
        setResults([]);
      });

    tauriInvoke<any>('synthesize_memory', { 
      query, 
      filter: filterParam 
    })
      .then(synth => {
        setSynthesis(synth);
      })
      .catch(() => {
        setSynthesis(null);
      });
  }, [query, activeFilter, lockStatus]);

  // Global & In-App Shortcut Listeners
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    import('@tauri-apps/api/event')
      .then(({ listen }) => {
        listen('toggle-hud', () => {
          if (lockStatus === 'unlocked') {
            setActiveScreen(prev => prev === 'hud' ? 'main' : 'hud');
          }
        }).then(fn => { unlisten = fn; });
      })
      .catch(() => {});

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.code === 'Space' || e.key === ' ')) {
        if (lockStatus === 'unlocked') {
          e.preventDefault();
          setActiveScreen(prev => prev === 'hud' ? 'main' : 'hud');
        }
      }
      if (e.key === 'Escape') {
        if (activeScreen === 'hud' || activeScreen === 'settings') {
          setActiveScreen('main');
        }
        setShowImportModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (unlisten) unlisten();
    };
  }, [activeScreen, lockStatus]);

  // Save current connector config to encrypted storage
  const saveCurrentConfig = async (overrides?: {
    obsidian?: string;
    gmail?: string;
    telegram?: string;
    notion?: string;
  }) => {
    const config = {
      obsidian_path: (overrides?.obsidian !== undefined ? overrides.obsidian : obsidianPath).trim() || null,
      gmail_token: (overrides?.gmail !== undefined ? overrides.gmail : gmailToken).trim() || null,
      telegram_path: (overrides?.telegram !== undefined ? overrides.telegram : telegramPath).trim() || null,
      notion_api_key: (overrides?.notion !== undefined ? overrides.notion : notionKey).trim() || null,
      auto_sync_interval_secs: 60,
    };
    try {
      await tauriInvoke('save_connectors_config', { config });
    } catch (_) {}
  };

  // Auth Action: Setup Master Passphrase
  const handleSetupPassphrase = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (passphrase.length < 8) {
      setAuthError('Master passphrase must be at least 8 characters.');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setAuthError('Passphrases do not match.');
      return;
    }
    setIsAuthenticating(true);
    try {
      await tauriInvoke('setup_master_passphrase', { passphrase });
      setPassphrase('');
      setConfirmPassphrase('');
      setLockStatus('unlocked');
      refreshStats();
      loadConnectorsConfig();
    } catch (err: any) {
      setAuthError(typeof err === 'string' ? err : err?.message || 'Failed to initialize master passphrase.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Auth Action: Unlock Vault
  const handleUnlockVault = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!passphrase) {
      setAuthError('Please enter your master passphrase.');
      return;
    }
    setIsAuthenticating(true);
    try {
      await tauriInvoke('unlock_vault', { passphrase });
      setPassphrase('');
      setLockStatus('unlocked');
      refreshStats();
      loadConnectorsConfig();
    } catch {
      setAuthError('Incorrect master passphrase. Access denied.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Auth Action: Lock Vault
  const handleLockVault = async () => {
    try {
      await tauriInvoke('lock_vault');
      setLockStatus('locked');
      setResults([]);
      setSelectedDocId('');
      setSynthesis(null);
    } catch (err) {
      console.warn('Failed to lock vault', err);
    }
  };

  // Connector Ingestion Handlers
  const handleSyncObsidian = async () => {
    if (!obsidianPath.trim()) return;
    setIsSyncing(true);
    setSyncStatus('Watching folder & encrypting documents...');
    await saveCurrentConfig({ obsidian: obsidianPath });
    try {
      const count = await tauriInvoke<number>('sync_obsidian', { folderPath: obsidianPath.trim() });
      setSyncStatus(`Synced & encrypted ${count} new Obsidian notes.`);
      refreshStats();
      setTimeout(() => setShowImportModal(false), 1400);
    } catch (err: any) {
      setSyncStatus(`Obsidian sync error: ${err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncGmail = async () => {
    if (!gmailToken.trim()) return;
    setIsSyncing(true);
    setSyncStatus('Connecting to Gmail & fetching unindexed threads...');
    await saveCurrentConfig({ gmail: gmailToken });
    try {
      const count = await tauriInvoke<number>('sync_gmail', { accessToken: gmailToken.trim() });
      setSyncStatus(`Synced & encrypted ${count} new emails.`);
      refreshStats();
      setTimeout(() => setShowImportModal(false), 1400);
    } catch (err: any) {
      setSyncStatus(`Gmail sync error: ${err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncTelegram = async () => {
    if (!telegramPath.trim()) return;
    setIsSyncing(true);
    setSyncStatus('Scanning Telegram archive & deduplicating messages...');
    await saveCurrentConfig({ telegram: telegramPath });
    try {
      const count = await tauriInvoke<number>('sync_telegram', { exportPath: telegramPath.trim() });
      setSyncStatus(`Synced & encrypted ${count} new Telegram messages.`);
      refreshStats();
      setTimeout(() => setShowImportModal(false), 1400);
    } catch (err: any) {
      setSyncStatus(`Telegram sync error: ${err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncNotion = async () => {
    if (!notionKey.trim()) return;
    setIsSyncing(true);
    setSyncStatus('Querying Notion Search API & flattening blocks...');
    await saveCurrentConfig({ notion: notionKey });
    try {
      const count = await tauriInvoke<number>('sync_notion', { apiKey: notionKey.trim() });
      setSyncStatus(`Synced & encrypted ${count} new Notion pages.`);
      refreshStats();
      setTimeout(() => setShowImportModal(false), 1400);
    } catch (err: any) {
      setSyncStatus(`Notion sync error: ${err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAllConnectors = async () => {
    setIsSyncing(true);
    setSyncStatus('Synchronizing all configured software...');
    await saveCurrentConfig();
    try {
      const res = await tauriInvoke<Record<string, number>>('sync_all_connectors');
      const total = Object.values(res || {}).reduce((a, b) => a + b, 0);
      setSyncStatus(`Sync finished: ${total} new records ingested across connectors.`);
      refreshStats();
      setTimeout(() => setShowImportModal(false), 1400);
    } catch (err: any) {
      setSyncStatus(`Sync error: ${err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyCitation = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 1500);
  };

  const openConnectorTab = (tab: 'obsidian' | 'gmail' | 'telegram' | 'notion') => {
    setActiveConnectorTab(tab);
    setShowImportModal(true);
  };

  const selectedDoc = results.find(r => r.id === selectedDocId) || results[0];

  // Screen 1: Loading State
  if (lockStatus === 'loading') {
    return (
      <div data-ui="context-vault" className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-[#0c0e12] text-slate-200 font-sans select-none">
        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-3">
          <Lock className="w-4 h-4 animate-pulse" />
        </div>
        <p className="text-xs text-slate-400 font-medium">Verifying vault cryptographic envelope...</p>
      </div>
    );
  }

  // Screen 2: Setup Master Passphrase (Uninitialized Vault)
  if (lockStatus === 'uninitialized') {
    return (
      <div data-ui="context-vault" className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-[#0c0e12] text-slate-200 font-sans p-6 select-none">
        <div className="w-full max-w-md bg-[#12151c] rounded-2xl border border-white/[0.14] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200">
              <Key className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-100 tracking-tight">Create Master Passphrase</h1>
              <p className="text-xs text-slate-400">Context Vault Sovereign Encryption</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-6">
            Your vault is encrypted on-device with AES-256-GCM. The key is derived using Argon2id. There are no cloud recovery backdoors. Write down this passphrase.
          </p>

          <form onSubmit={handleSetupPassphrase} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Master Passphrase (min. 8 chars)</label>
              <input 
                type="password"
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                placeholder="Enter strong passphrase..."
                className="w-full bg-[#0c0e12] text-slate-100 placeholder-slate-500 text-xs px-3.5 py-2.5 rounded-lg border border-white/[0.10] focus:border-sky-400 focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">Confirm Master Passphrase</label>
              <input 
                type="password"
                value={confirmPassphrase}
                onChange={e => setConfirmPassphrase(e.target.value)}
                placeholder="Confirm your passphrase..."
                className="w-full bg-[#0c0e12] text-slate-100 placeholder-slate-500 text-xs px-3.5 py-2.5 rounded-lg border border-white/[0.10] focus:border-sky-400 focus:outline-none transition-colors"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 flex items-center gap-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={isAuthenticating || !passphrase || !confirmPassphrase}
              className="w-full py-2.5 rounded-lg bg-slate-100 hover:bg-white text-slate-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isAuthenticating ? 'Deriving Argon2id Key...' : 'Initialize Encrypted Vault'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/[0.07] flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero Knowledge Architecture</span>
            </span>
            <span>Argon2id + AES-256-GCM</span>
          </div>
        </div>
      </div>
    );
  }

  // Screen 3: Vault Lock Screen (Locked State)
  if (lockStatus === 'locked') {
    return (
      <div data-ui="context-vault" className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-[#0c0e12] text-slate-200 font-sans p-6 select-none">
        <div className="w-full max-w-sm bg-[#12151c] rounded-2xl border border-white/[0.14] p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 mx-auto mb-4">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>

          <h1 className="text-base font-semibold text-slate-100 tracking-tight mb-1">Vault Locked</h1>
          <p className="text-xs text-slate-400 mb-6">Enter your Master Passphrase to decrypt the local index and software tokens.</p>

          <form onSubmit={handleUnlockVault} className="space-y-4">
            <input 
              type="password"
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
              placeholder="Master Passphrase..."
              className="w-full bg-[#0c0e12] text-slate-100 placeholder-slate-500 text-xs px-3.5 py-2.5 rounded-lg border border-white/[0.10] focus:border-sky-400 focus:outline-none transition-colors text-center"
              autoFocus
            />

            {authError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300">
                {authError}
              </div>
            )}

            <button 
              type="submit"
              disabled={isAuthenticating || !passphrase}
              className="w-full py-2.5 rounded-lg bg-slate-100 hover:bg-white text-slate-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{isAuthenticating ? 'Decrypting Key...' : 'Unlock Vault'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/[0.07] text-[11px] text-slate-500">
            Hardware-Isolated Local Cryptography
          </div>
        </div>
      </div>
    );
  }

  // Active Unlocked State
  const totalDocsCount = stats?.total_messages ?? results.length;
  const isFreshVault = totalDocsCount === 0;

  return (
    <div data-ui="context-vault" className="h-[100dvh] w-screen flex flex-col bg-[#0c0e12] text-slate-200 font-sans antialiased overflow-hidden select-none">
      
      {/* Clean Desktop Header Bar */}
      <header className="h-13 bg-[#080a0d] border-b border-white/[0.07] px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <span className="font-semibold text-sm text-slate-100 tracking-tight">Context Vault</span>
            </div>
          </div>

          <div className="h-4 w-px bg-white/10 mx-1"></div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Local Encrypted Database</span>
            <span className="text-slate-600">·</span>
            <span>{totalDocsCount} documents indexed</span>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setShowImportModal(true)} 
            className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-400" />
            <span>Connect Software</span>
          </button>

          {!isFreshVault && (
            <button 
              onClick={() => setActiveScreen('hud')} 
              className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-white text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Quick Search</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 text-[10px] font-mono font-bold">⌘K</kbd>
            </button>
          )}

          <button 
            onClick={handleLockVault}
            title="Lock Vault"
            className="px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Lock</span>
          </button>
        </div>
      </header>

      {/* Main Surface: Clean Onboarding View vs 3-Pane Reader View */}
      {isFreshVault ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-2xl space-y-8">
            
            {/* Onboarding Welcome Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <Shield className="w-3.5 h-3.5" />
                <span>Vault Initialized & Cryptographically Secured</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Connect Your Software to Begin</h2>
              <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                Context Vault is completely empty. It indexes your documents and conversations locally with zero telemetry and on-device PII protection. Choose a source below to start.
              </p>
            </div>

            {/* 4 Clean Connector Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Tile 1: Obsidian */}
              <div 
                onClick={() => openConnectorTab('obsidian')}
                className="p-5 rounded-xl bg-[#12151c] border border-white/[0.07] hover:border-amber-400/50 hover:bg-[#171b24] cursor-pointer transition-colors group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 group-hover:text-amber-400 transition-colors">Live Watcher</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-1">Obsidian Vault</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Point to your local Markdown directory. Tracks note creations and edits automatically via real-time filesystem events.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-medium text-amber-400">
                  <span>Connect Obsidian Folder</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Tile 2: Gmail */}
              <div 
                onClick={() => openConnectorTab('gmail')}
                className="p-5 rounded-xl bg-[#12151c] border border-white/[0.07] hover:border-teal-400/50 hover:bg-[#171b24] cursor-pointer transition-colors group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-400/10 border border-teal-400/20 flex items-center justify-center text-teal-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 group-hover:text-teal-400 transition-colors">OAuth Sync</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-1">Gmail / Google Workspace</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Fetch and decrypt email messages locally. Automated zero-knowledge scrubbing wipes API keys, credit cards, and PII.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-medium text-teal-400">
                  <span>Connect Gmail Account</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Tile 3: Telegram */}
              <div 
                onClick={() => openConnectorTab('telegram')}
                className="p-5 rounded-xl bg-[#12151c] border border-white/[0.07] hover:border-sky-400/50 hover:bg-[#171b24] cursor-pointer transition-colors group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 group-hover:text-sky-400 transition-colors">Desktop Export</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-1">Telegram Chats</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Import Telegram Desktop JSON export files. Chunks long message histories and applies deterministic message deduplication.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-medium text-sky-400">
                  <span>Import Telegram Export</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Tile 4: Notion */}
              <div 
                onClick={() => openConnectorTab('notion')}
                className="p-5 rounded-xl bg-[#12151c] border border-white/[0.07] hover:border-rose-400/50 hover:bg-[#171b24] cursor-pointer transition-colors group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-400/10 border border-rose-400/20 flex items-center justify-center text-rose-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 group-hover:text-rose-400 transition-colors">API Token</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-1">Notion Workspace</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Flatten and index private Notion documents, database properties, nested task lists, and code blocks into local memory.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-medium text-rose-400">
                  <span>Connect Notion Token</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

            </div>

            {/* Bottom Security Footer */}
            <div className="pt-4 border-t border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hardware AES-256-GCM</span>
                </span>
                <span className="text-slate-600">·</span>
                <span>Argon2id Key Derivation</span>
                <span className="text-slate-600">·</span>
                <span>Zero Cloud Servers</span>
              </div>
              <button 
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs cursor-pointer"
              >
                Open Software Connectors
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* 3-Pane Main Layout for populated vaults */
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Navigation Sidebar */}
          <aside className="w-60 bg-[#080a0d] border-r border-white/[0.07] flex flex-col justify-between p-3 shrink-0">
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-medium text-slate-400 px-2 py-1 mb-1">
                  Connected Sources
                </div>
                <nav className="space-y-0.5">
                  <button 
                    onClick={() => setActiveFilter('All')} 
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeFilter === 'All' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-slate-300" />
                      <span>All Documents</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{totalDocsCount}</span>
                  </button>

                  <button 
                    onClick={() => setActiveFilter('Obsidian')} 
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeFilter === 'Obsidian' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>Obsidian Notes</span>
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Live Watch</span>
                  </button>

                  <button 
                    onClick={() => setActiveFilter('Gmail')} 
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeFilter === 'Gmail' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-teal-400" />
                      <span>Gmail & Work</span>
                    </span>
                    <span className="text-xs text-slate-500 font-mono">OAuth</span>
                  </button>

                  <button 
                    onClick={() => setActiveFilter('Telegram')} 
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeFilter === 'Telegram' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4 text-sky-400" />
                      <span>Telegram Chats</span>
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Auto</span>
                  </button>

                  <button 
                    onClick={() => setActiveFilter('Notion')} 
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      activeFilter === 'Notion' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-rose-400" />
                      <span>Notion Pages</span>
                    </span>
                    <span className="text-xs text-slate-500 font-mono">API</span>
                  </button>
                </nav>
              </div>

              {/* Privacy Shield Audit */}
              <div className="p-3 rounded-lg bg-[#12151c] border border-white/[0.07] space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Privacy Guard</span>
                  </span>
                  <span className="text-emerald-400 text-[11px]">Active</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  API keys and credit card numbers are scrubbed on-device prior to encryption.
                </p>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-white/5 flex items-center justify-between">
                  <span>Scrubbed items</span>
                  <span className="text-slate-200 font-mono font-medium">{piiLogs.length} keys</span>
                </div>
              </div>
            </div>

            {/* Storage & Footer Telemetry */}
            <div className="pt-3 border-t border-white/[0.07] text-xs text-slate-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>Encrypted Storage</span>
                <span className="text-slate-300 font-mono">{(stats?.storage_kb ? (stats.storage_kb / 1024).toFixed(1) : '0.0')} MB</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Zero External Leakage</span>
                <span className="text-emerald-400 font-medium">Enforced</span>
              </div>
            </div>
          </aside>

          {/* Center Pane: Clean Search & Results List */}
          <section className="w-96 bg-[#12151c] border-r border-white/[0.07] flex flex-col shrink-0">
            {/* Search Input Area */}
            <div className="p-3 border-b border-white/[0.07]">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input 
                  type="text" 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search across Obsidian, Gmail, Telegram, Notion..."
                  className="w-full bg-[#0c0e12] text-slate-100 placeholder-slate-500 text-xs pl-9 pr-8 py-2.5 rounded-lg border border-white/[0.07] focus:border-white/30 focus:outline-none transition-colors"
                />
                {query && (
                  <button 
                    onClick={() => setQuery('')} 
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-400">
                <span>{results.length} matching items</span>
                <span>Indexed locally</span>
              </div>
            </div>

            {/* Result List Cards */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.07]">
              {results.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No matching documents found in this collection.
                </div>
              ) : (
                results.map((r) => {
                  const isSelected = r.id === selectedDocId;
                  return (
                    <article 
                      key={r.id}
                      onClick={() => setSelectedDocId(r.id)} 
                      className={`p-3.5 cursor-pointer transition-colors border-l-2 ${
                        isSelected 
                          ? 'bg-[#1c212d] border-sky-400' 
                          : 'hover:bg-[#171b24] border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium text-xs truncate max-w-[220px] ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {r.title || r.metadata?.title || 'Untitled Document'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {r.metadata?.timestamp ? new Date(r.metadata.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {r.content || r.snippet || 'No preview content available.'}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                          r.source_type === 'Obsidian' ? 'bg-amber-400' :
                          r.source_type === 'Telegram' ? 'bg-sky-400' :
                          r.source_type === 'Notion' ? 'bg-rose-400' : 'bg-teal-400'
                        }`}></span>
                        <span>{r.source_type || 'Document'}</span>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* Right Pane: Comfortable Reading & Detail Canvas */}
          <main className="flex-1 bg-[#0c0e12] flex flex-col overflow-hidden">
            {selectedDoc ? (
              <>
                {/* Document Header */}
                <div className="h-14 border-b border-white/[0.07] px-8 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-400">
                      {selectedDoc.source_type || 'Document'}
                    </span>
                    <span className="text-slate-600">/</span>
                    <span className="text-xs text-slate-300 font-mono">
                      {selectedDoc.metadata?.timestamp || 'Vault Item'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleCopyCitation(selectedDoc.content || selectedDoc.title)}
                      className="px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedCitation ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{copiedCitation ? 'Copied' : 'Copy Text'}</span>
                    </button>
                  </div>
                </div>

                {/* Document Content Body */}
                <div className="flex-1 overflow-y-auto p-8 max-w-3xl">
                  <h1 className="text-xl font-bold text-slate-100 tracking-tight mb-4">
                    {selectedDoc.title || selectedDoc.metadata?.title || 'Document Content'}
                  </h1>

                  {/* High-Level Synthesis Summary */}
                  {synthesis?.answer && (
                    <div className="p-4 rounded-xl bg-[#12151c] border border-white/[0.07] mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                        <span className="text-xs font-semibold text-slate-200">Summary</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {synthesis.answer}
                      </p>
                    </div>
                  )}

                  {/* Full Document Reader Text */}
                  <div className="space-y-4 text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {selectedDoc.content}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                <HardDrive className="w-8 h-8 text-slate-600 mb-2" />
                <span>Select a document from the list to read.</span>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Quick Search Spotlight Modal (⌘K) */}
      {activeScreen === 'hud' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl bg-[#12151c] rounded-xl border border-white/[0.14] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-3 border-b border-white/[0.07] flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type to search your entire local vault..."
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                autoFocus
              />
              <kbd 
                onClick={() => setActiveScreen('main')}
                className="px-2 py-0.5 rounded bg-white/5 text-slate-400 text-xs font-mono cursor-pointer"
              >
                ESC
              </kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {results.slice(0, 5).map(r => (
                <div 
                  key={r.id}
                  onClick={() => {
                    setSelectedDocId(r.id);
                    setActiveScreen('main');
                  }} 
                  className="p-2.5 rounded-lg hover:bg-[#171b24] cursor-pointer flex items-center justify-between text-xs"
                >
                  <span className="text-slate-200 font-medium">{r.title || 'Document'}</span>
                  <span className="text-slate-500">{r.source_type}</span>
                </div>
              ))}
            </div>
            <div className="p-2.5 bg-[#080a0d] border-t border-white/[0.07] flex items-center justify-between text-[11px] text-slate-500">
              <span>Press ↵ to open document</span>
              <span>100% on-device</span>
            </div>
          </div>
        </div>
      )}

      {/* Connect Software Ingestion Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-[#12151c] rounded-xl border border-white/[0.14] shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <h3 className="text-sm font-semibold text-slate-100">Connect Your Software</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white text-xs cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Connector Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#0c0e12] rounded-lg border border-white/[0.07]">
              <button 
                type="button"
                onClick={() => setActiveConnectorTab('obsidian')}
                className={`py-1.5 px-2 rounded-md text-center text-xs font-medium transition-colors cursor-pointer ${
                  activeConnectorTab === 'obsidian' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Obsidian
              </button>
              <button 
                type="button"
                onClick={() => setActiveConnectorTab('gmail')}
                className={`py-1.5 px-2 rounded-md text-center text-xs font-medium transition-colors cursor-pointer ${
                  activeConnectorTab === 'gmail' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Gmail
              </button>
              <button 
                type="button"
                onClick={() => setActiveConnectorTab('telegram')}
                className={`py-1.5 px-2 rounded-md text-center text-xs font-medium transition-colors cursor-pointer ${
                  activeConnectorTab === 'telegram' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Telegram
              </button>
              <button 
                type="button"
                onClick={() => setActiveConnectorTab('notion')}
                className={`py-1.5 px-2 rounded-md text-center text-xs font-medium transition-colors cursor-pointer ${
                  activeConnectorTab === 'notion' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Notion
              </button>
            </div>

            {/* Tab 1: Obsidian */}
            {activeConnectorTab === 'obsidian' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Point Context Vault to your local Obsidian directory. New and edited notes are indexed automatically via the real-time background watcher.
                </p>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1 font-medium">Vault Folder Path</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={obsidianPath}
                      onChange={e => setObsidianPath(e.target.value)}
                      placeholder="/Users/name/Documents/ObsidianVault" 
                      className="flex-1 bg-[#0c0e12] text-slate-200 px-3 py-2 rounded-lg border border-white/[0.07] focus:border-white/20 focus:outline-none text-xs" 
                    />
                    <button 
                      disabled={isSyncing || !obsidianPath.trim()}
                      onClick={handleSyncObsidian}
                      className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-medium text-xs disabled:opacity-50 cursor-pointer"
                    >
                      Sync Vault
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Gmail */}
            {activeConnectorTab === 'gmail' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Sync personal Gmail or Google Workspace accounts incrementally. Messages are scrubbed and encrypted on-device.
                </p>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1 font-medium">OAuth Access Token or App Password</label>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      value={gmailToken}
                      onChange={e => setGmailToken(e.target.value)}
                      placeholder="ya29.a0AfH6SM..." 
                      className="flex-1 bg-[#0c0e12] text-slate-200 px-3 py-2 rounded-lg border border-white/[0.07] focus:border-white/20 focus:outline-none text-xs font-mono" 
                    />
                    <button 
                      disabled={isSyncing || !gmailToken.trim()}
                      onClick={handleSyncGmail}
                      className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-medium text-xs disabled:opacity-50 cursor-pointer"
                    >
                      Sync Gmail
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Telegram */}
            {activeConnectorTab === 'telegram' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Provide the path to your Telegram Desktop export folder or result.json file.
                </p>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1 font-medium">Telegram Export File or Directory</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={telegramPath}
                      onChange={e => setTelegramPath(e.target.value)}
                      placeholder="/Users/name/Downloads/Telegram Desktop/result.json" 
                      className="flex-1 bg-[#0c0e12] text-slate-200 px-3 py-2 rounded-lg border border-white/[0.07] focus:border-white/20 focus:outline-none text-xs" 
                    />
                    <button 
                      disabled={isSyncing || !telegramPath.trim()}
                      onClick={handleSyncTelegram}
                      className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-medium text-xs disabled:opacity-50 cursor-pointer"
                    >
                      Sync Chats
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Notion */}
            {activeConnectorTab === 'notion' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Connect your Notion workspace via an Internal Integration Token (starts with secret_).
                </p>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1 font-medium">Internal Integration Secret</label>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      value={notionKey}
                      onChange={e => setNotionKey(e.target.value)}
                      placeholder="secret_789123..." 
                      className="flex-1 bg-[#0c0e12] text-slate-200 px-3 py-2 rounded-lg border border-white/[0.07] focus:border-white/20 focus:outline-none text-xs font-mono" 
                    />
                    <button 
                      disabled={isSyncing || !notionKey.trim()}
                      onClick={handleSyncNotion}
                      className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-medium text-xs disabled:opacity-50 cursor-pointer"
                    >
                      Sync Notion
                    </button>
                  </div>
                </div>
              </div>
            )}

            {syncStatus && (
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-[11px] text-slate-300 font-mono">
                {syncStatus}
              </div>
            )}

            <div className="p-3 rounded-lg bg-[#0c0e12] border border-white/[0.07] text-[11px] text-slate-400 space-y-1">
              <div className="text-emerald-400 font-semibold">100% On-Device Cryptography</div>
              <div>All connectors parse content locally, strip PII, and commit encrypted chunks using AES-256-GCM. No external data leakage.</div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.07]">
              <span className="text-[11px] text-slate-500 font-mono">
                Continuous auto-sync: 60s
              </span>
              <div className="flex items-center gap-2">
                <button 
                  disabled={isSyncing}
                  onClick={handleSyncAllConnectors} 
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs disabled:opacity-50 cursor-pointer"
                >
                  Sync All Configured
                </button>
                <button onClick={() => setShowImportModal(false)} className="px-3 py-1.5 rounded-lg bg-[#0c0e12] hover:bg-white/5 text-slate-300 text-xs cursor-pointer">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

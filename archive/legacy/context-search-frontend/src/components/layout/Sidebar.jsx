// src/components/layout/Sidebar.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useChat } from '../../hook/chat.hook';
import { useEffect, useState, useCallback } from 'react';
import { useLogout } from '../../hook/authentication.hook';

// Helper icons matching the mock reference UI
const MessageIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const FileIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const SystemIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const SecurityIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const groupChatsByDate = (chatsList) => {
  const groups = { TODAY: [], YESTERDAY: [], PREVIOUS: [] };
  const todayStr = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  chatsList.forEach((chat) => {
    if (!chat.created_at) {
      groups.TODAY.push(chat);
      return;
    }
    const chatDateStr = new Date(chat.created_at).toDateString();
    if (chatDateStr === todayStr) {
      groups.TODAY.push(chat);
    } else if (chatDateStr === yesterdayStr) {
      groups.YESTERDAY.push(chat);
    } else {
      groups.PREVIOUS.push(chat);
    }
  });
  return groups;
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [chats, setChats] = useState([]);
  const [hoveredChatId, setHoveredChatId] = useState(null);

  // Modal states for confirmation management
  const [chatToDelete, setChatToDelete] = useState(null);

  const { logoutUser } = useLogout();
  const searchParams = new URLSearchParams(location.search);
  const activeChatId = searchParams.get('chatId');

  const handleLogout = async () => {
    await logoutUser();
  };

  const currentProfileId = localStorage.getItem('currentProfileId');
  const currentProfileType = localStorage.getItem('currentProfileType') || 'STANDARD';
  const { fetch_chats, create_chat, delete_chat } = useChat();

  const handleCreateChat = async (profileId) => {
    const newChat = await create_chat(profileId, currentProfileType);

    const response = await fetch_chats(profileId);
    if (response && response.data) {
      setChats(response.data);
    }
  };

  // Triggers confirmation overlay instead of auto-destroying immediately
  const openDeleteModal = (e, chat) => {
    e.stopPropagation(); // Stop routing redirection clicks from parental divs
    setChatToDelete(chat);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;

    await delete_chat(chatToDelete.id);
    setChatToDelete(null);

    // If the currently active chat was deleted, clear url parameters or redirect
    if (activeChatId === chatToDelete.id) {
      navigate(`/dashboard/omni-search?profileId=${currentProfileId}&profileType=${currentProfileType}`);
    }

    const response = await fetch_chats(currentProfileId);
    if (response && response.data) {
      setChats(response.data);
    }
  };

// 1. Create a stable function that doesn't get stuck in old closures
  const loadChats = useCallback(async () => {
    if (!currentProfileId) return;
    try {
      const response = await fetch_chats(currentProfileId);
      if (response && response.data) {
        setChats(response.data);
      }
    } catch (err) {
      console.error("Failed to load chats:", err);
    }
  }, [currentProfileId]);

  // 2. Fetch data initially on load
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // 3. Keep the event listener fresh and linked to the live function
  useEffect(() => {
    window.addEventListener('sync_sidebar_chats', loadChats);

    return () => {
      window.removeEventListener('sync_sidebar_chats', loadChats);
    };
  }, [loadChats]);

  const groupedChats = groupChatsByDate(chats);

  const getMockMeta = (index) => {
    const metas = [
      { tag: "WORKSPACE", icon: <MessageIcon />, color: "#38bdf8" },
      { tag: "ENCRYPTED", icon: <FileIcon />, color: "#34d399" },
      { tag: "SYSTEM", icon: <SystemIcon />, color: "#a78bfa" }
    ];
    return metas[index % metas.length];
  };

  return (
    <>
      <aside
        style={{
          position: "fixed",
          left: 0,
          top: 70,
          height: "calc(100vh - 70px)",
          width: 220,
          background: "#08090d",
          borderRight: "1px solid rgba(255, 255, 255, 0.04)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 0 12px 0",
          overflow: "hidden",
          zIndex: 50,
          fontFamily: "var(--font-mono), monospace",
        }}
      >
        {/* Global CSS Injecting Custom Scrollbars */}
        <style>{`
          .scroll-feed::-webkit-scrollbar { width: 4px; }
          .scroll-feed::-webkit-scrollbar-track { background: transparent; }
          .scroll-feed::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 2px; }
          .scroll-feed::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.15); }
        `}</style>

        {/* Cyberpunk Action Button */}
        <div style={{ padding: "0 16px", marginBottom: 24 }}>
          <button
            onClick={() => handleCreateChat(currentProfileId)}
            style={{
              width: "100%",
              padding: "11px 16px",
              background: "transparent",
              border: "1px solid rgba(139, 162, 203, 0.15)",
              borderRadius: "4px",
              color: "#8ba2cb",
              fontFamily: "inherit",
              fontSize: 10,
              fontWeight: "600",
              letterSpacing: "0.2em",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(139, 162, 203, 0.15)";
              e.currentTarget.style.color = "#8ba2cb";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <span>[+]</span> NEW_CHAT
          </button>
        </div>

        {/* Main Stream Container */}
        <div
          className="scroll-feed"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "0 10px 0 16px",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {Object.entries(groupedChats).map(([timeGroup, items]) => {
            if (items.length === 0) return null;

            return (
              <div key={timeGroup} style={{ marginBottom: 24 }}>
                {/* Timeline Indicator Section */}
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: "700",
                    color: "rgba(255, 255, 255, 0.2)",
                    letterSpacing: "0.2em",
                    marginBottom: 12,
                    paddingLeft: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                  }}
                >
                  <span>//{timeGroup}</span>
                  <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(255,255,255,0.05), transparent)" }} />
                </div>

                {/* Chat Cards Deck */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {items.map((chat, idx) => {
                    const isActive = activeChatId === chat.id;
                    const isHovered = hoveredChatId === chat.id;
                    const meta = getMockMeta(idx);
                    const timeString = chat.created_at
                      ? new Date(chat.created_at).toTimeString().split(' ')[0]
                      : "00:00:00";

                    return (
                      <div
                        key={chat.id}
                        onMouseEnter={() => setHoveredChatId(chat.id)}
                        onMouseLeave={() => setHoveredChatId(null)}
                        onClick={() =>
                          navigate(`/dashboard/omni-search?profileId=${currentProfileId}&chatId=${chat.id}&profileType=${currentProfileType}`)
                        }
                        style={{
                          position: "relative",
                          width: "100%",
                          padding: "12px",
                          background: isActive
                            ? "rgba(255, 255, 255, 0.03)"
                            : isHovered ? "rgba(255, 255, 255, 0.01)" : "transparent",
                          borderRadius: "4px",
                          border: "1px solid",
                          borderColor: isActive ? "rgba(255, 255, 255, 0.08)" : "transparent",
                          cursor: "pointer",
                          transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                          boxSizing: "border-box",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px"
                        }}
                      >
                        {/* Left Structural Active-State Block */}
                        {isActive && (
                          <div style={{
                            position: "absolute",
                            left: 0,
                            top: "20%",
                            height: "60%",
                            width: "2px",
                            background: meta.color,
                            boxShadow: `0 0 8px ${meta.color}`
                          }} />
                        )}

                        {/* Top Meta Line: Status Dot + Icon + Title text */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                            {/* Colored Theme-scoped Status Icon */}
                            <div style={{ color: isActive ? meta.color : "#4b5563", transition: "color 0.2s", display: "flex", alignItems: "center" }}>
                              {meta.icon}
                            </div>

                            <span
                              style={{
                                fontSize: 11.5,
                                fontWeight: isActive ? "500" : "400",
                                color: isActive ? "#ffffff" : isHovered ? "#d1d5db" : "#9ca3af",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                letterSpacing: "0.01em"
                              }}
                            >
                              {chat.title || "NODE_SECURE_CONN"}
                            </span>
                          </div>

                          {/* Completely Isolated Hover Actions Button */}
                          <button
                            onClick={(e) => openDeleteModal(e, chat)}
                            style={{
                              background: "transparent",
                              border: "none",
                              padding: "4px",
                              color: "#4b5563",
                              cursor: "pointer",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: isHovered ? 1 : 0,
                              transition: "all 0.15s ease",
                              flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              e.currentTarget.style.color = "#ef4444";
                              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "#4b5563";
                              e.currentTarget.style.background = "transparent";
                            }}
                            title="Purge Stream"
                          >
                            <TrashIcon />
                          </button>
                        </div>

                        {/* Meta Information Footer (Timestamp + Path Tag) */}
                        <div
                          style={{
                            fontSize: 9,
                            color: "rgba(255,255,255,0.25)",
                            letterSpacing: "0.05em",
                            display: "flex",
                            alignItems: "center",
                            paddingLeft: 21
                          }}
                        >
                          <span style={{ color: isActive ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)" }}>{timeString}</span>
                          <span style={{ margin: "0 6px", color: "rgba(255,255,255,0.08)" }}>|</span>
                          <span style={{
                            color: isActive ? meta.color : "rgba(255,255,255,0.25)",
                            fontWeight: "600",
                            fontSize: 8.5
                          }}>
                            {meta.tag}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Core Systems Navigation Footer */}
        <div style={{ padding: "8px 16px 0 16px", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
          <button
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              background: "transparent",
              border: "none",
              borderRadius: "4px",
              color: "#6b7280",
              fontFamily: "inherit",
              fontSize: 10.5,
              cursor: "pointer",
              letterSpacing: "0.05em",
              textAlign: "left",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#6b7280";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <SecurityIcon />
            <span>SECURITY_PROTOCOL</span>
          </button>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              background: "transparent",
              border: "none",
              borderRadius: "4px",
              color: "#6b7280",
              fontFamily: "inherit",
              fontSize: 10.5,
              cursor: "pointer",
              letterSpacing: "0.05em",
              textAlign: "left",
              transition: "all 0.15s ease",
              marginTop: 2
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#6b7280";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogoutIcon />
            <span>LOGOUT</span>
          </button>
        </div>
      </aside>

      {/* Embedded Cyber Confirmation Overlay Portal */}
      {chatToDelete && (
        <div
          onClick={() => setChatToDelete(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(5, 6, 8, 0.85)",
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()} // Stop click passthroughs from auto-closing modal
            style={{
              width: "360px",
              background: "#0c0d14",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "6px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(239, 68, 68, 0.05)",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            {/* Header Identity */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ color: "#ef4444", display: "flex" }}>
                <TrashIcon />
              </div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#ef4444", letterSpacing: "0.15em" }}>
                CRITICAL_ACTION_REQUIRED
              </span>
            </div>

            {/* Explanatory Context Content */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "12px", color: "#d1d5db", lineHeight: "1.5" }}>
                Are you sure you want to permanently purge this session data stream?
              </div>
              <div style={{
                fontSize: "11px",
                color: "#6b7280",
                background: "rgba(255,255,255,0.02)",
                padding: "8px 12px",
                borderRadius: "4px",
                borderLeft: "2px solid #3b4257",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                NODE: {chatToDelete.title || "NODE_SECURE_CONN"}
              </div>
            </div>

            {/* System Controls Panel Grid */}
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                onClick={() => setChatToDelete(null)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "4px",
                  color: "#9ca3af",
                  fontFamily: "inherit",
                  fontSize: "10.5px",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#9ca3af";
                }}
              >
                ABORT
              </button>
              <button
                onClick={confirmDeleteChat}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "4px",
                  color: "#ef4444",
                  fontFamily: "inherit",
                  fontSize: "10.5px",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#ef4444";
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.boxShadow = "0 0 14px rgba(239, 68, 68, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                  e.currentTarget.style.color = "#ef4444";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                DELETE_CHAT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

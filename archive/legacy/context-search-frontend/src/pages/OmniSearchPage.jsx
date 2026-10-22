// src/pages/OmniSearchPage.jsx
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import StatusBar from "../components/ui/StatusBar";
import { useSearch } from "../hook/search.hook";
import { useChat } from "../hook/chat.hook";

const SendIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const ExtLinkIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const INITIAL_MESSAGES = [];

function UserMessage({ msg }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
      <div
        style={{
          background: "#1a2235",
          border: "1px solid var(--border-mid)",
          borderRadius: "8px 8px 0 8px",
          padding: "10px 16px",
          maxWidth: "65%",
          fontSize: 13,
          color: "var(--text-primary)",
          lineHeight: 1.5,
        }}
      >
        {msg.text}
      </div>
    </div>
  );
}

function AiMessage({ msg, onClick, dots }) {
  return (
    <div style={{ marginBottom: 8 }}>
      {/* AI header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 14px",
          background: "var(--bg-input)",
          borderTop: "1px solid var(--border-mid)",
          borderLeft: "1px solid var(--border-mid)",
          borderRight: "1px solid var(--border-mid)",
          borderRadius: "6px",
          fontSize: 9,
          letterSpacing: "0.14em",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent-blue)",
              display: "inline-block",
              border: "1px solid var(--bg-input)",
            }}
          />
          <span style={{ color: "var(--accent-blue)" }}>Context Buddy</span>
        </span>
        <span style={{ color: "var(--text-muted)" }}>VER_4.2.0</span>
      </div>

      {/* AI body */}
      <div
        style={{
          border: "1px solid var(--border-mid)",
          background: "var(--bg-card)",
          padding: "16px",
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: "var(--text-primary)",
            lineHeight: 1.6,
            marginLeft: 8,
          }}
        >
          {msg.statusText && msg.text === "" ? (
            <span style={{ opacity: 0.6 }}>
              {msg.statusText}
              {dots}
            </span>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.text || ""}
            </ReactMarkdown>
          )}

          {msg.status === "streaming" && <span style={{ opacity: 0.7 }}>▍</span>}
        </div>

        {msg.sources && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 14,
            }}
          >
            {msg.sources.map((src, i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-mid)",
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 9,
                      letterSpacing: "0.14em",
                      color: src.dot,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: src.dot,
                        display: "inline-block",
                        border: "1px solid var(--bg-input)",
                      }}
                    />
                    {src.service}
                  </span>
                  <ExtLinkIcon />
                </div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 4,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {src.title}
                </p>
                <p
                  style={{
                    fontSize: 10,
                    color: "var(--text-dim)",
                    lineHeight: 1.5,
                  }}
                >
                  {src.excerpt}
                </p>
              </div>
            ))}
          </div>
        )}

        {msg.note && (
          <p
            style={{
              fontSize: 12,
              color: "var(--text-dim)",
              fontStyle: "italic",
              lineHeight: 1.6,
            }}
          >
            {msg.note}
          </p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 14px",
          background: "var(--bg-input)",
          borderBottom: "1px solid var(--border-mid)",
          borderLeft: "1px solid var(--border-mid)",
          borderRight: "1px solid var(--border-mid)",
          borderRadius: "0 0 6px 6px",
        }}
      >
        {msg.rawSources?.length > 0 && (
          <div
            style={{
              marginTop: 6,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(74,158,255,.3)",
                background: "rgba(74,158,255,.1)",
                fontSize: 10,
                letterSpacing: ".08em",
                transition: "all .2s ease",
              }}
            >
              <span>{msg.rawSources.length} VIEW SOURCES USED</span>
            </div>
          </div>
        )}

        {msg.analysisTime && (
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.12em",
              color: "var(--text-muted)",
              marginTop: 6,
            }}
          >
            ANALYSIS_COMPLETE // {msg.analysisTime}
          </div>
        )}
      </div>
    </div>
  );
}

function ContextModal({ message, onClose }) {
  const [expandedSource, setExpandedSource] = useState(null);

  if (!message) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.65)",
        backdropFilter: "blur(0.4px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      {/* PANEL */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "520px",
          height: "100vh",
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--border-mid)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "18px",
            borderBottom: "1px solid var(--border-mid)",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: ".14em",
              color: "var(--text-dim)",
            }}
          >
            RETRIEVED SOURCES
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {message.rawSources?.length || 0} sources used
          </div>

          {/* CLOSE */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "transparent",
              border: "1px solid var(--border-mid)",
              color: "var(--text-dim)",
              cursor: "pointer",
              transition: "all .15s ease",
              fontSize: 16,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ff4d4f";
              e.currentTarget.style.borderColor = "#ff4d4f";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-dim)";
              e.currentTarget.style.borderColor = "var(--border-mid)";
            }}
          >
            ×
          </button>
        </div>

        {/* LIST */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 14,
          }}
        >
          {message.rawSources?.map((source) => {
            const expanded = expandedSource === source.id;

            return (
              <div
                key={source.id}
                onClick={() => setExpandedSource(expanded ? null : source.id)}
                style={{
                  marginBottom: 24,
                  padding: 14,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "transform .15s ease, border-color .15s ease",
                  cursor: "pointer",
                }}
              >
                {/* TITLE */}
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 6,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {source.subject || "No subject"}
                </div>

                {/* META ROW */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: "var(--text-dim)",
                    marginBottom: 10,
                  }}
                >
                  <span>{source.sender}</span>
                  <span style={{ textTransform: "uppercase", opacity: 0.7 }}>
                    {source.type}
                  </span>
                </div>

                {/* CONTENT */}
                <div
                  style={{
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: "var(--text-primary)",
                    opacity: 0.9,
                  }}
                >
                  {expanded ? source.content : source.content.slice(0, 140)}
                </div>

                {/* FOOTER */}
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {/* RELEVANCE */}
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--accent-green)",
                      background: "rgba(72,187,120,0.1)",
                      padding: "2px 6px",
                      borderRadius: 999,
                      opacity: 0.9,
                    }}
                  >
                    {(source.finalScore * 100).toFixed(1)}% relevant
                  </div>

                  {/* SHOW MORE */}
                  {source.content.length > 140 && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-dim)",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      {expanded ? "Show less ↑" : "Show more ↓"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function OmniSearchPage() {
  const { search } = useSearch();
  const { fetch_conversation, create_chat, fetch_chats } = useChat();
  const location = useLocation();
  const navigate = useNavigate();

  const chatId = new URLSearchParams(location.search).get("chatId");
  const currentProfileId = new URLSearchParams(location.search).get("profileId");
  const currentProfileType = new URLSearchParams(location.search).get("profileType") || "STANDARD";

  const [dots, setDots] = useState(".");
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const isEmptyChat = messages.length === 0;

  useEffect(() => {
    if (!chatId) {
      setMessages([]); // Clear down state if missing ID entirely
      return;
    }

    fetch_conversation(chatId).then((response) => {
      console.log(response);

      const formatted = response.data.flatMap((conversation) => [
        {
          id: `${conversation.id}-user`,
          type: "user",
          text: conversation.query,
        },
        {
          id: `${conversation.id}-ai`,
          type: "ai",
          text: conversation.response,
          rawSources: conversation.results || [],
          status: "done",
        },
      ]);

      setMessages(formatted);
    });
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % 4;
      if (step === 0) setDots(".");
      if (step === 1) setDots("..");
      if (step === 2) setDots("...");
      if (step === 3) setDots("");
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !chatId) return;

    const aiId = Date.now() + 1;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "user",
        text,
        time: new Date().toLocaleTimeString(),
      },
      {
        id: aiId,
        type: "ai",
        text: "",
        sources: [],
        status: "searching",
        statusText: "Building answer with AI...",
      },
    ]);

    setInput("");

    await search(
      text,
      aiId,
      (event) => {
        handleStreamEvent(event, aiId);
      },
      chatId,
      currentProfileId,
      currentProfileType
    );
  };

  const updateAIMessage = (aiId, updater) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== aiId) return msg;
        return updater(msg);
      }),
    );
  };

  const handleStreamEvent = (event, aiId) => {
    switch (event.type) {
      case "token":
        updateAIMessage(aiId, (msg) => ({
          ...msg,
          text: (msg.text || "") + event.content,
          status: "streaming",
          statusText: "",
        }));
        break;
      case "status":
        updateAIMessage(aiId, (msg) => ({
          ...msg,
          status: event.stage,
          statusText: event.message,
        }));
        break;
      case "source":
        updateAIMessage(aiId, (msg) => ({
          ...msg,
          sources: mapSources(event.data),
        }));
        break;
      case "done":
        updateAIMessage(aiId, (msg) => ({
          ...msg,
          status: "done",
          statusText: "",
          rawSources: event.sources || [],
          analysisTime:
            ((event.timings?.rag_time_ms || 0) / 1000).toFixed(2) + "s",
        }));
        break;
      case "error":
        updateAIMessage(aiId, (msg) => ({
          ...msg,
          text: event.content,
          status: "error",
        }));
        break;
    }
  };

  const mapSources = (results) => {
    return results.map((item) => ({
      service: item.type || "EMAIL",
      dot: item.type === "EMAIL" ? "#4a9eff" : "#a855f7",
      title: item.subject || "No Subject",
      excerpt: (item.content || "").slice(0, 120),
    }));
  };

  const handleCreateNewChat = async () => {
    const activeProfileId = currentProfileId || localStorage.getItem('currentProfileId');
    const activeProfileType = currentProfileType || localStorage.getItem('currentProfileType') || "STANDARD";


    try {
      // 1. Run the backend creation logic
      await create_chat(activeProfileId, activeProfileType);

      // 2. Give the database a tiny split second (200ms) to finish writing the row,
      // then force the sidebar event to fire regardless of the 'undefined' return.
      setTimeout(() => {
        window.dispatchEvent(new Event('sync_sidebar_chats'));
      }, 100);

    } catch (err) {
      console.error("Error during session stream generation:", err);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-base)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          letterSpacing: "0.1em",
          padding: "5px 18px",
          background: "rgba(10,11,14,.95)",
          borderBottom: "1px solid var(--border-dim)",
        }}
      >
        AI Search Dashboard
      </div>
      <Navbar showSidebar />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar />

        {/* Main context view split */}
        <div
          style={{
            flex: 1,
            display: "flex",
            marginLeft: 210,
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {!chatId ? (
            /* EXCELLENT NO CHAT ID UX WORKSPACE */
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "0 40px",
                background: "radial-gradient(circle at center, rgba(30,37,56,0.15) 0%, transparent 65%)",
              }}
            >
              <div style={{ textAlign: "center", maxWidth: 500 }}>
                {/* Visual Terminal Placeholder Signifier */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 999,
                    color: "var(--text-muted)",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    fontFamily: "var(--font-mono)",
                    marginBottom: 24,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffb84c" }} />
                  NO_ACTIVE_WORKSPACE
                </div>

                <h2
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 12,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Initialize Context Session
                </h2>

                <p
                  style={{
                    color: "var(--text-dim)",
                    fontSize: 14,
                    lineHeight: 1.6,
                    marginBottom: 32,
                  }}
                >
                  To leverage automated semantic deep-retrieval across memories or index files, select a previous running instance from the sidebar or initialize a fresh timeline below.
                </p>

                <button
                  onClick={handleCreateNewChat}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                    border: "1px solid rgba(74, 158, 255, 0.4)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "transform 0.15s ease, border-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-blue)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(74, 158, 255, 0.4)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <PlusIcon />
                  <span>Create New Session</span>
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE CHAT WORKSPACE */
            <>
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "24px 24px 0",
                }}
              >
                {isEmptyChat ? (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: "0 40px",
                    }}
                  >
                    <div style={{ textAlign: "center", marginBottom: 40 }}>
                      <div
                        style={{
                          fontSize: 42,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          marginBottom: 12,
                        }}
                      >
                        Context Buddy
                      </div>

                      <div
                        style={{
                          color: "var(--text-dim)",
                          fontSize: 15,
                          maxWidth: 650,
                          lineHeight: 1.7,
                        }}
                      >
                        Search across your emails, notes, documents, conversations
                        and memories using AI-powered retrieval.
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        width: "100%",
                        maxWidth: 760,
                      }}
                    >
                      {[
                        "Summarize recent emails",
                        "What projects am I working on?",
                        "Find conversations about AI",
                        "Show upcoming deadlines",
                      ].map((suggestion) => (
                        <div
                          key={suggestion}
                          onClick={() => setInput(suggestion)}
                          style={{
                            cursor: "pointer",
                            padding: 16,
                            border: "1px solid var(--border-mid)",
                            background: "var(--bg-card)",
                            borderRadius: 10,
                            transition: "all .2s ease",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              color: "var(--text-primary)",
                            }}
                          >
                            {suggestion}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        {msg.type === "user" && (
                          <>
                            <UserMessage msg={msg} />
                            <div
                              style={{
                                textAlign: "right",
                                fontSize: 8,
                                letterSpacing: "0.12em",
                                color: "var(--text-muted)",
                                marginBottom: 14,
                              }}
                            >
                              USER_QUERY_SENT // {msg.time}
                            </div>
                          </>
                        )}

                        {msg.type === "ai" && (
                          <AiMessage
                            msg={msg}
                            dots={dots}
                            onClick={() => {
                              if (currentProfileType === "STANDARD" && msg.rawSources?.length) {
                                setSelectedMessage(msg);
                              }
                            }}
                          />
                        )}
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Input bar wrapper */}
              <div
                style={{
                  padding: isEmptyChat ? "0 24px 80px" : "14px 24px",
                  borderTop: isEmptyChat ? "none" : "1px solid var(--border-dim)",
                  width: isEmptyChat ? "900px" : "100%",
                  maxWidth: isEmptyChat ? "900px" : "unset",
                  alignSelf: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    border: "1px solid var(--border-mid)",
                    background: "var(--bg-input)",
                    padding: "0 14px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.12em",
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ verticalAlign: "middle", marginRight: 4 }}
                    >
                      <polyline points="4 17 10 11 4 5" />
                      <line x1="12" y1="19" x2="20" y2="19" />
                    </svg>
                    QUERY_SYSTEM &gt;
                  </span>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type your command or search query..."
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      padding: "13px 0",
                      outline: "none",
                      letterSpacing: "0.04em",
                    }}
                  />
                  <button
                    onClick={handleSend}
                    style={{
                      background: "none",
                      border: "none",
                      color: input.trim() ? "var(--accent-blue)" : "var(--text-muted)",
                      cursor: "pointer",
                      padding: "6px",
                      display: "flex",
                      transition: "color 0.2s",
                    }}
                  >
                    <SendIcon />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <ContextModal message={selectedMessage} onClose={() => setSelectedMessage(null)} />
    </div>
  );
}

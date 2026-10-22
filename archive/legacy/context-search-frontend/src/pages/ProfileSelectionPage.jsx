// src/pages/ProfileSelectionPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogoutButton } from "../components/ui/Logout";
import { CreateProfilePopup } from "../components/ui/CreateProfile";
import { useGetProfiles } from "../hook/profile.hook";
import StatusBar from "../components/ui/StatusBar";
import CornerBrackets from "../components/ui/CornerBrackets";
import { useDeleteProfile } from "../hook/profile.hook";

/* ---------------- DYNAMIC CSS INJECTION ---------------- */
if (typeof document !== "undefined") {
  const styleId = "profile-system-styles";
  let styleElement = document.getElementById(styleId);

  if (styleElement) {
    styleElement.remove();
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @keyframes profile-shake {
      0% { transform: translate(0.3px, 0.3px) rotate(0deg); }
      16% { transform: translate(-0.3px, -0.2px) rotate(-0.1deg); }
      32% { transform: translate(-0.2px, 0px) rotate(0.1deg); }
      48% { transform: translate(0px, 0.3px) rotate(0deg); }
      64% { transform: translate(0.3px, -0.2px) rotate(0.1deg); }
      80% { transform: translate(-0.3px, 0.3px) rotate(-0.1deg); }
      100% { transform: translate(0.3px, -0.2px) rotate(-0.1deg); }
    }
    .shake-active {
      animation: profile-shake 0.5s infinite ease-in-out;
    }
  `;
  document.head.appendChild(style);
}

/* ---------------- ICONS ---------------- */

const BriefcaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);

const PersonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const CheckIcon = ({ color = "#4af0c4" }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ---------------- CONFIRM DELETION MODAL ---------------- */

function ConfirmDeleteModal({ profileName, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(10, 11, 16, 0.85)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-mid)",
          padding: "32px",
          maxWidth: "420px",
          width: "100%",
          position: "relative",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        }}
      >
        <CornerBrackets color="#ff5f7a" />

        <h3
          style={{
            fontFamily: "var(--font-display)",
            color: "#ff5f7a",
            fontSize: 18,
            letterSpacing: "0.1em",
            marginBottom: 12,
            textAlign: "center"
          }}
        >
          CRITICAL_DELETION_PROTOCOL
        </h3>

        <p
          style={{
            fontSize: 12,
            color: "var(--text-dim)",
            lineHeight: "1.6",
            marginBottom: 28,
            textAlign: "center"
          }}
        >
          Are you certain you want to permanently purge profile <strong style={{ color: "var(--text-primary)" }}>{profileName}</strong>? All workspace instances, cache arrays, and AI memory sub-layers will be permanently unlinked.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "1px solid var(--border-mid)",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontSize: 10,
              letterSpacing: "0.12em",
            }}
          >
            ABORT_ACTION
          </button>

          <button
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              background: "rgba(255, 95, 122, 0.1)",
              border: "1px solid #ff5f7a",
              color: "#ff5f7a",
              cursor: "pointer",
              fontSize: 10,
              letterSpacing: "0.12em",
            }}
          >
            CONFIRM_DELETE
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- PROFILE CARD ---------------- */

function ProfileCard({ profile, onSelect, isEditMode, onDeleteClick }) {
  const [hovered, setHovered] = useState(false);

  function getColor(color) {
    if (color === "BLUE") return { hex: "#4a9eff", rgb: "74, 158, 255" };
    if (color === "CYAN") return { hex: "#00d4ff", rgb: "0, 212, 255" };
    if (color === "GREEN") return { hex: "#00ff9d", rgb: "0, 255, 157" };
    if (color === "ORANGE") return { hex: "#e8a04a", rgb: "232, 160, 74" };
    if (color === "RED") return { hex: "#ff5f7a", rgb: "255, 95, 122" };
    if (color === "PURPLE") return { hex: "#b07cff", rgb: "176, 124, 255" };
    return { hex: "#4a9eff", rgb: "74, 158, 255" };
  }

  const themeColors = getColor(profile.color);
  const colorHex = themeColors.hex;
  const colorRgb = themeColors.rgb;

  const isStateless = profile.type === "STATELESS";

  return (
    <div
      className={isEditMode ? "shake-active" : ""}
      onClick={isEditMode ? null : onSelect}
      onMouseEnter={() => !isEditMode && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: "var(--bg-card)",
        border: `1px solid ${isEditMode ? "#ff5f7a" : hovered ? colorHex : "var(--border-dim)"}`,
        cursor: isEditMode ? "default" : "pointer",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: hovered && !isEditMode ? `0 12px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(${colorRgb}, 0.05)` : "none",
      }}
    >
      {/* EXPLICIT REMOVE ICON FOR EDIT MODE */}
      {isEditMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#ff5f7a",
            border: "none",
            color: "#0a0b10",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 30,
            fontSize: 11,
            boxShadow: "0 0 10px rgba(255, 95, 122, 0.4)",
          }}
        >
          ✕
        </button>
      )}

      {/* Dynamic brackets matching theme colors on hover */}
      <CornerBrackets color={isEditMode ? "#ff5f7a" : hovered ? colorHex : "#2e3a4f"} />

      {/* ================= SHARED COMPACT HEADER BLOCKS ================= */}
      <div
        style={{
          background: isStateless ? colorHex : "transparent",
          borderBottom: isStateless ? "none" : "1px solid var(--border-dim)",
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
        }}
      >
        <div style={{ color: isStateless ? "#0a0b10" : "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              background: isStateless ? "rgba(10, 11, 16, 0.15)" : `rgba(${colorRgb}, 0.1)`,
              padding: "8px",
              display: "flex",
              color: isStateless ? "#0a0b10" : colorHex,
              border: isStateless ? "none" : `1px solid rgba(${colorRgb}, 0.2)`
            }}
          >
            {isStateless ? <PersonIcon /> : <BriefcaseIcon />}
          </div>
          <div>
            <span
              style={{
                fontSize: 8,
                letterSpacing: "0.15em",
                display: "block",
                opacity: isStateless ? 0.8 : 0.6,
                fontWeight: "bold"
              }}
            >
              INSTANCE_NODE
            </span>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: 0, color: isStateless ? "#0a0b10" : "var(--text-primary)" }}>
              {profile.name}
            </h3>
          </div>
        </div>
        <div
          style={{
            fontSize: 8,
            letterSpacing: "0.1em",
            color: isStateless ? colorHex : "var(--text-primary)",
            background: isStateless ? "#0a0b10" : `rgba(${colorRgb}, 0.15)`,
            border: isStateless ? "none" : `1px solid ${colorHex}`,
            padding: "4px 8px",
            fontWeight: "bold"
          }}
        >
          {profile.type}
        </div>
      </div>

      {/* ================= UNIFIED BODY LAYER ================= */}
      <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Sync Metadata Array */}
        <p style={{ fontSize: 10, color: "var(--text-dim)", marginBottom: 20, marginTop: 0 }}>
          {isStateless ? "▲ MEMORY: VOLATILE (EPHEMERAL)" : `▪ LAST_SYNC: ${profile.lastSync}`}
        </p>

        {/* Status Line Layout */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center", marginTop: "auto" }}>
        </div>

        {/* Dynamic Action Trigger Blocks */}
        <button
          disabled={isEditMode}
          style={{
            width: "100%",
            padding: "11px",
            border: `1px solid ${isEditMode ? "var(--border-dim)" : colorHex}`,
            background: isStateless ? `rgba(${colorRgb}, 0.08)` : hovered ? colorHex : "var(--bg-input)",
            color: !isStateless && hovered ? "#0a0b10" : "var(--text-primary)",
            fontSize: 10,
            letterSpacing: "0.16em",
            cursor: isEditMode ? "not-allowed" : "pointer",
            fontWeight: "bold",
            transition: "all 0.15s ease",
          }}
        >
          {isEditMode ? "TERMINATE_ACCESS" : isStateless ? "ENTER_PROFILE" : "ENTER_PROFILE"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- CREATE CARD ---------------- */

function CreateProfileCard({ onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px dashed ${hovered ? "var(--accent-blue)" : "var(--border-mid)"}`,
        minHeight: 276,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        background: hovered ? "rgba(74,158,255,0.03)" : "transparent",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          border: `1px solid ${hovered ? "var(--accent-blue)" : "var(--border-mid)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: hovered ? "var(--accent-blue)" : "var(--text-dim)",
          marginBottom: 16,
        }}
      >
        <PlusIcon />
      </div>

      <h3 style={{ fontSize: 18, marginBottom: 6 }}>Create New Profile</h3>
      <p style={{ fontSize: 9, letterSpacing: "0.18em", color: "var(--text-dim)" }}>
        ALLOCATE_NEURAL_SLOT
      </p>
    </div>
  );
}

/* ---------------- MAIN PAGE ---------------- */

export default function ProfileSelectionPage() {
  const navigate = useNavigate();
  const [refreshFlag, setRefreshFlag] = useState(0);
  const { getProfiles } = useGetProfiles();
  const { deleteProfile } = useDeleteProfile();

  const [profiles, setProfiles] = useState([]);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);

  const hasProfiles = profiles.length > 0;
  const triggerRefresh = () => setRefreshFlag((prev) => prev + 1);

  useEffect(() => {
    const fetchProfiles = async () => {
      const data = await getProfiles();
      setProfiles(data);
    };
    fetchProfiles();
  }, [refreshFlag]);

  const handleDeleteConfirm = async () => {
    if (!profileToDelete) return;
    try {
      await deleteProfile(profileToDelete.id);
      setProfileToDelete(null);
      triggerRefresh();
    } catch (err) {
      console.error("Purge failure:", err);
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
      {/* TOP BAR */}
      <div
        style={{
          padding: "6px 20px",
          background: "rgba(10,11,16,0.95)",
          borderBottom: "1px solid var(--border-dim)",
          fontSize: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <span>Profile Selection</span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {hasProfiles && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              style={{
                background: isEditMode ? "rgba(255, 95, 122, 0.1)" : "transparent",
                border: `1px solid ${isEditMode ? "#ff5f7a" : "var(--border-mid)"}`,
                color: isEditMode ? "#ff5f7a" : "var(--text-primary)",
                padding: "4px 10px",
                fontSize: 9,
                cursor: "pointer",
                letterSpacing: "0.1em",
                transition: "all 0.2s"
              }}
            >
              {isEditMode ? "EXIT_MANAGE_MODE" : "MANAGE_PROFILES"}
            </button>
          )}
          <LogoutButton />
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "60px 48px 40px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ borderTop: "1px solid var(--border-dim)", marginBottom: 48 }} />

          {/* ================= EMPTY STATE ================= */}
          {!hasProfiles ? (
            <div
              style={{
                minHeight: 420,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                border: "1px solid var(--border-dim)",
                background: "linear-gradient(180deg, rgba(74,158,255,0.04), transparent)",
                padding: 40,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  border: "1px solid var(--border-mid)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 18,
                  color: "var(--accent-blue)",
                  background: "var(--bg-input)",
                }}
              >
                <PlusIcon />
              </div>

              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 10 }}>
                No Profiles Found
              </h2>

              <p style={{ fontSize: 11, color: "var(--text-dim)", maxWidth: 320, marginBottom: 24 }}>
                Initialize your first profile to begin syncing workspace data and AI memory layers.
              </p>

              <button
                onClick={() => setShowCreatePopup(true)}
                style={{
                  padding: "12px 18px",
                  border: "1px solid var(--accent-blue)",
                  background: "rgba(74,158,255,0.08)",
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  cursor: "pointer",
                  color: "var(--accent-blue)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(74,158,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(74,158,255,0.08)";
                }}
              >
                CREATE_FIRST_PROFILE
              </button>
            </div>
          ) : (
            /* ================= GRID ================= */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 20,
              }}
            >
              {profiles.map((p) => (
                <ProfileCard
                  key={p.id}
                  profile={p}
                  isEditMode={isEditMode}
                  onDeleteClick={() => setProfileToDelete(p)}
                  onSelect={() => {
                    localStorage.setItem("currentProfileId", p.id);
                    localStorage.setItem("currentProfileType", p.type);
                    navigate(`/dashboard/omni-search?profileId=${p.id}&profileType=${p.type}`);
                  }}
                />
              ))}

              {!isEditMode && <CreateProfileCard onClick={() => setShowCreatePopup(true)} />}
            </div>
          )}

          {showCreatePopup && (
            <CreateProfilePopup
              onClose={() => setShowCreatePopup(false)}
              triggerRefresh={triggerRefresh}
            />
          )}

          {/* SYSTEM OVERLAY MODALS */}
          {profileToDelete && (
            <ConfirmDeleteModal
              profileName={profileToDelete.name}
              onConfirm={handleDeleteConfirm}
              onCancel={() => setProfileToDelete(null)}
            />
          )}
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{ margin: "0 auto 40px", maxWidth: 960 }}>
        <StatusBar
          left={[
            {
              dot: isEditMode ? "#ff5f7a" : "#4af0c4",
              label: isEditMode ? "SYSTEM_STATUS: MUTATION_MODE_ACTIVE" : "SYSTEM_LOAD: 12%"
            },
            { icon: "▣", label: "SERVER: EDGE_NODE_09" },
          ]}
          right="© 2024 NEURAL_SEARCH_PROTOCOL ▪ ▪ ▪"
        />
      </div>
    </div>
  );
}

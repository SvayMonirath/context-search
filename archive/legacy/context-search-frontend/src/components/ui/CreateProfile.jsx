import { useState } from "react";
import { useCreateProfile } from "../../hook/profile.hook";

const PROFILE_COLORS = [
  "#4a9eff",
  "#00d4ff",
  "#00ff9d",
  "#e8a04a",
  "#ff5f7a",
  "#b07cff",
];

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M4 21C4 17.6863 7.58172 15 12 15C16.4183 15 20 17.6863 20 21"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect
      x="5"
      y="11"
      width="14"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M8 11V8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V11"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

export const CreateProfilePopup = ({
  onClose,
  triggerRefresh
}) => {
  const { createProfile } = useCreateProfile();

  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PROFILE_COLORS[0]);
  const [profileType, setProfileType] = useState("STANDARD");
  const [focused, setFocused] = useState(false);



  const handleCreate = async () => {
    if (!name.trim()) return;

    let setColor = "";

    if(selectedColor === PROFILE_COLORS[0]) setColor = "BLUE";
    if(selectedColor === PROFILE_COLORS[1]) setColor = "CYAN";
    if(selectedColor === PROFILE_COLORS[2]) setColor = "GREEN";
    if(selectedColor === PROFILE_COLORS[3]) setColor = "ORANGE";
    if(selectedColor === PROFILE_COLORS[4]) setColor = "RED";
    if(selectedColor === PROFILE_COLORS[5]) setColor = "PURPLE";

    await createProfile(
      name,
      setColor,
      profileType,
    );

    await triggerRefresh();
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(8px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
        padding: 20,
      }}
    >
      <div
        style={{
          width: 520,
          background: "var(--bg-card)",
          border: "1px solid var(--border-dim)",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,.45)",
        }}
      >
        {/* Top Accent Bar */}
        <div
          style={{
            height: 2,
            background: selectedColor,
            boxShadow: `0 0 15px ${selectedColor}`,
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: "24px 28px 0",
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: selectedColor,
              fontFamily: "var(--font-mono)",
              marginBottom: 8,
            }}
          >
            PROFILE_CREATION_PROTOCOL
          </div>

          <h2
            style={{
              margin: 0,
              color: "var(--text-primary)",
              fontSize: 24,
              fontWeight: 700,
              fontFamily: "var(--font-display)",
            }}
          >
            Create Neural Profile
          </h2>

          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              fontSize: 12,
              color: "var(--text-dim)",
              lineHeight: 1.7,
            }}
          >
            Initialize a new isolated memory container with its own
            context, history, and identity layer.
          </p>
        </div>

        {/* Body */}
        <div
          style={{
            padding: 28,
          }}
        >
          {/* Profile Name */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 10,
                letterSpacing: "0.16em",
                color: "var(--text-dim)",
                fontFamily: "var(--font-mono)",
              }}
            >
              PROFILE NAME
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Research Assistant"
              style={{
                width: "100%",
                padding: "12px 14px",
                boxSizing: "border-box",
                background: "var(--bg-input)",
                border: `1px solid ${
                  focused || name.trim()
                    ? selectedColor
                    : "var(--border-mid)"
                }`,
                color: "var(--text-primary)",
                outline: "none",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                transition: "all .2s ease",
                boxShadow:
                  focused || name.trim()
                    ? `0 0 0 3px ${selectedColor}20`
                    : "none",
              }}
            />
          </div>

          {/* Profile Type */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                marginBottom: 10,
                fontSize: 10,
                letterSpacing: "0.16em",
                color: "var(--text-dim)",
                fontFamily: "var(--font-mono)",
              }}
            >
              PROFILE SECURITY
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {/* Standard */}
              <button
                type="button"
                onClick={() => setProfileType("STANDARD")}
                style={{
                  background:
                    profileType === "STANDARD"
                      ? "rgba(74,158,255,.08)"
                      : "var(--bg-input)",
                  border:
                    profileType === "STANDARD"
                      ? "1px solid var(--accent-blue)"
                      : "1px solid var(--border-mid)",
                  padding: 16,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all .2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                    color:
                      profileType === "STANDARD"
                        ? "var(--accent-blue)"
                        : "var(--text-secondary)",
                  }}
                >
                  <UserIcon />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: ".08em",
                    }}
                  >
                    STANDARD
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 11,
                    lineHeight: 1.6,
                    color: "var(--text-dim)",
                  }}
                >
                  General purpose profile with standard memory storage and quick access.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setProfileType("STATELESS")}
                style={{
                  background:
                    profileType === "STATELESS"
                      ? "rgba(232,160,74,.08)"
                      : "var(--bg-input)",
                  border:
                    profileType === "STATELESS"
                      ? "1px solid var(--accent-amber)"
                      : "1px solid var(--border-mid)",
                  padding: 16,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all .2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                    color:
                      profileType === "STATELESS"
                        ? "var(--accent-amber)"
                        : "var(--text-secondary)",
                  }}
                >
                  <LockIcon />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: ".08em",
                    }}
                  >
                    STATELESS
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 11,
                    lineHeight: 1.6,
                    color: "var(--text-dim)",
                  }}
                >
                  Independent encrypted memory container with enhanced privacy controls.
                </div>
              </button>
            </div>
          </div>

          {/* Color Selection */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                marginBottom: 10,
                fontSize: 10,
                letterSpacing: "0.16em",
                color: "var(--text-dim)",
                fontFamily: "var(--font-mono)",
              }}
            >
              PROFILE COLOR
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              {PROFILE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: color,
                    cursor: "pointer",
                    transition: "all .2s ease",
                    border:
                      selectedColor === color
                        ? "2px solid #fff"
                        : "1px solid rgba(255,255,255,.15)",
                    boxShadow:
                      selectedColor === color
                        ? `0 0 20px ${color}`
                        : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Summary */}
          <div
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-dim)",
              padding: 14,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.14em",
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              PROFILE CONFIGURATION
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: selectedColor,
                  boxShadow: `0 0 10px ${selectedColor}`,
                }}
              />

              <span
                style={{
                  color: "var(--text-primary)",
                  fontSize: 12,
                }}
              >
                {name || "Unnamed Profile"}
              </span>

              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  letterSpacing: ".08em",
                  color:
                    profileType === "STATELESS"
                      ? "var(--accent-amber)"
                      : "var(--accent-blue)",
                }}
              >
                {profileType === "STATELESS"
                  ? "STATELESS"
                  : "STANDARD"}
              </span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "12px 18px",
                background: "transparent",
                border: "1px solid var(--border-mid)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                letterSpacing: ".08em",
              }}
            >
              CANCEL
            </button>

            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              style={{
                padding: "12px 18px",
                background: selectedColor,
                border: "none",
                color: "#fff",
                cursor: name.trim() ? "pointer" : "not-allowed",
                opacity: name.trim() ? 1 : 0.5,
                fontFamily: "var(--font-mono)",
                letterSpacing: ".08em",
                boxShadow: `0 0 20px ${selectedColor}40`,
                transition: "all .2s ease",
              }}
            >
              CREATE PROFILE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

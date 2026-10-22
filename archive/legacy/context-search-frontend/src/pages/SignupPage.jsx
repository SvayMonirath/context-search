// src/pages/RegisterPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CornerBrackets from "../components/ui/CornerBrackets";

import { useRegister } from "../hook/authentication.hook";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerUser }  = useRegister();

  const ShieldIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z"
        stroke="#e8a04a"
        strokeWidth="1.5"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="#e8a04a"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );


  const [form, setForm] = useState({
    username: "",
    email: "",
    hash_password: "",
    confirm_password: "",
  });

  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
      const data = await registerUser(form.username, form.email, form.hash_password, form.confirm_password);
  }

  const inputStyle = (field) => ({
    width: "100%",
    padding: "12px 14px",
    background: "var(--bg-input)",
    border: `1px solid ${focusedField === field ? "var(--accent-blue)" : "var(--border-dim)"}`,
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    outline: "none",
    letterSpacing: "0.05em",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxShadow:
      focusedField === field ? "0 0 0 2px rgba(74,158,255,0.08)" : "none",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
      }}
    >
      <div
        className="animate-fade-up"
        style={{
          position: "relative",
          background: "var(--bg-card)",
          border: "1px solid var(--border-dim)",
          width: 380,
          padding: "36px 32px 28px",
        }}
      >
        <CornerBrackets />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "var(--accent-blue)",
            marginBottom: 10,
          }}
        >
          SYSTEM_INIT
          <span
            style={{ flex: 1, height: 1, background: "var(--border-dim)" }}
          />
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "0.02em",
            marginBottom: 6,
          }}
        >
          Create Neural Profile
        </h1>

        <p
          style={{
            fontSize: 12,
            color: "var(--text-dim)",
            letterSpacing: "0.04em",
            marginBottom: 28,
          }}
        >
          Initialize a new encrypted identity layer.
        </p>

        {/* Username */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "var(--text-dim)",
              marginBottom: 6,
            }}
          >
            USERNAME
          </label>

          <input
            type="text"
            value={form.username}
            onChange={(e) => handleChange("username", e.target.value)}
            placeholder="neural_operator"
            style={inputStyle("username")}
            onFocus={() => setFocusedField("username")}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "var(--text-dim)",
              marginBottom: 6,
            }}
          >
            EMAIL IDENTIFIER
          </label>

          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="user@neural_link.arch"
            style={inputStyle("email")}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "var(--text-dim)",
              marginBottom: 6,
            }}
          >
            PASSWORD
          </label>

          <input
            type="password"
            value={form.hash_password}
            onChange={(e) => handleChange("hash_password", e.target.value)}
            placeholder="············"
            style={inputStyle("hash_password")}
            onFocus={() => setFocusedField("hash_password")}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: 22 }}>
          <label
            style={{
              display: "block",
              fontSize: 9,
              letterSpacing: "0.2em",
              color: "var(--text-dim)",
              marginBottom: 6,
            }}
          >
            CONFIRM PASSWORD
          </label>

          <input
            type="password"
            value={form.confirm_password}
            onChange={(e) => handleChange("confirm_password", e.target.value)}
            placeholder="············"
            style={inputStyle("confirm_password")}
            onFocus={() => setFocusedField("confirm_password")}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "14px",
            background: "var(--accent-blue)",
            border: "none",
            color: "#e8f0ff",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            letterSpacing: "0.18em",
            cursor: "pointer",
            transition: "all 0.2s",
            marginBottom: 16,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#5aadff")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--accent-blue)")
          }
        >
          REGISTER
        </button>
        {/* Privacy box */}
        <div
          style={{
            borderLeft: "2px solid var(--accent-amber)",
            background: "#131a21",
            padding: "12px 14px",
            marginBottom: 22,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <ShieldIcon />
          <div>
            <p
              style={{
                fontSize: 9,
                letterSpacing: "0.18em",
                color: "var(--accent-amber)",
                marginBottom: 4,
              }}
            >
              PRIVACY_CORE_V4
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-dim)",
                lineHeight: 1.6,
              }}
            >
              Independent memory isolation for every profile you create. Your
              neural data is encrypted at the edge.
            </p>
          </div>
        </div>

        {/* Footer navigation */}
        <div
          style={{
            borderTop: "1px solid var(--border-dim)",
            paddingTop: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 10,
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
          }}
        >
          <span>Already initialized?</span>

          <button
            onClick={() => navigate("/login")}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-blue)",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            LOGIN
          </button>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 9,
            letterSpacing: "0.12em",
            color: "var(--text-muted)",
            paddingTop: 14,
            marginTop: 6,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--accent-green)",
                display: "inline-block",
                animation: "pulse-dot 2s ease-in-out infinite",
              }}
            />
            ENCRYPTED_LINK: ACTIVE &nbsp; LATENCY: 12MS
          </span>
          <span>v0.9.2-ALPHA</span>
        </div>
      </div>
    </div>
  );
}

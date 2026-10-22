export default function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        flexDirection: "column",
        fontFamily: "var(--font-mono)",
        color: "var(--text-primary)",
      }}
    >
      {/* CORE LOADING MODULE */}
      <div
        style={{
          position: "relative",
          width: 140,
          height: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outer ring */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            border: "1px solid var(--border-dim)",
            borderRadius: "50%",
            animation: "spin 2.5s linear infinite",
          }}
        />

        {/* Middle ring */}
        <div
          style={{
            position: "absolute",
            width: "70%",
            height: "70%",
            border: "1px solid var(--accent-blue)",
            borderRadius: "50%",
            animation: "spinReverse 2s linear infinite",
          }}
        />

        {/* Core pulse */}
        <div
          style={{
            width: 14,
            height: 14,
            background: "var(--accent-green)",
            borderRadius: "50%",
            boxShadow: "0 0 20px var(--accent-green)",
            animation: "pulse-dot 1.5s ease-in-out infinite",
          }}
        />
      </div>

      {/* TEXT STATUS */}
      <div
        style={{
          marginTop: 28,
          textAlign: "center",
          letterSpacing: "0.2em",
          fontSize: 11,
        }}
      >
        INITIALIZING NEURAL LINK
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 10,
          color: "var(--text-muted)",
          letterSpacing: "0.15em",
        }}
      >
        ENCRYPTION_LAYER_SYNCING...
      </div>

      {/* PROGRESS BAR */}
      <div
        style={{
          marginTop: 20,
          width: 220,
          height: 2,
          background: "var(--border-dim)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "40%",
            height: "100%",
            background: "var(--accent-blue)",
            animation: "loadingBar 1.5s infinite ease-in-out",
          }}
        />
      </div>

      {/* KEYFRAMES */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes spinReverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }

          @keyframes loadingBar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(50%); }
            100% { transform: translateX(200%); }
          }
        `}
      </style>
    </div>
  );
}

import { useLogout } from "../../hook/authentication.hook";
export const LogoutButton = () => {
  const { logoutUser } = useLogout();
  const handleLogout = async () => {
    await logoutUser();
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: "4px 10px",
        background: "var(--bg-input)",
        border: "1px solid var(--border-mid)",
        color: "var(--text-secondary)",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.16em",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent-blue)";
        e.currentTarget.style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-mid)";
        e.currentTarget.style.color = "var(--text-secondary)";
      }}
    >
      Logout
    </button>
  );
}

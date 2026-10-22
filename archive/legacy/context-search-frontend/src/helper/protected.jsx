import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./auth.context";
import LoadingScreen from "../components/ui/LoadingScreen";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();


  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children
}

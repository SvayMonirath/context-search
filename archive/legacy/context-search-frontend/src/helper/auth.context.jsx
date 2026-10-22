import { useEffect, useState, createContext, useContext } from "react";
import { api } from "../api/global.api";
import { checkAuthAPI  } from "../api/authentication.api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const data = await checkAuthAPI();

      if (data?.status === "success") {
        setUser(data?.data?.user || null);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Auth check crashed:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() =>  {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);


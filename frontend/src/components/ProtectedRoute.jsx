import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps a route so only authenticated users with the required role can access it.
 * Others are redirected to /login.
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { auth } = useAuth();
  const navigate = useNavigate();

  if (!auth) {
    // Not logged in — redirect to login
    setTimeout(() => navigate("/login", { replace: true }), 0);
    return null;
  }

  if (requiredRole && auth.role !== requiredRole) {
    // Wrong role — redirect to their correct dashboard
    setTimeout(() => {
      navigate(auth.role === "admin" ? "/admin" : "/registrar", { replace: true });
    }, 0);
    return null;
  }

  return children;
}

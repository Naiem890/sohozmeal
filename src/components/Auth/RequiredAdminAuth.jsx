import { useAuthUser } from "react-auth-kit";
import { Navigate, useLocation } from "react-router-dom";

// eslint-disable-next-line react/prop-types
export default function RequiredAdminAuth({ children }) {
  const location = useLocation();
  const auth = useAuthUser();

  const isAdmin = auth()?.role === "admin";
  const isAdminAuthenticated = auth()?.isAuthenticated && isAdmin;

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return children;
}

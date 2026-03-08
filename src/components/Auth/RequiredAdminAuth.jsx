import { useAuthUser } from "react-auth-kit";
import { Navigate, useLocation } from "react-router-dom";

export default function RequiredAdminAuth({ children }) {
  const location = useLocation();
  const user = useAuthUser()();

  if (!user || user.role !== "admin") {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }
  return children;
}

import { useAuthUser } from "react-auth-kit";
import { Navigate, useLocation } from "react-router-dom";

const STAFF_ROLES = new Set(["MESS", "WIFI", "CLEANING", "REPAIR"]);

export default function RequiredStaffAuth({ children }) {
  const location = useLocation();
  const user = useAuthUser()();

  if (!user || !STAFF_ROLES.has(user.role)) {
    return <Navigate to="/staff" state={{ from: location }} replace />;
  }
  return children;
}

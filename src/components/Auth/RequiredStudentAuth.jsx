import { useAuthUser } from "react-auth-kit";
import { Navigate, useLocation } from "react-router-dom";

export default function RequiredStudentAuth({ children }) {
  const location = useLocation();
  const user = useAuthUser()();

  if (!user || user.role !== "student") {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
}

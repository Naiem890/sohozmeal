import { useAuthUser } from "react-auth-kit";
import { Navigate, useLocation } from "react-router-dom";

// eslint-disable-next-line react/prop-types
export default function RequiredStudentAuth({ children }) {
  const location = useLocation();
  const auth = useAuthUser();

  const isStudent = auth()?.role === "student";
  const isStudentAuthenticated = auth()?.isAuthenticated && isStudent;

  if (!isStudentAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
}

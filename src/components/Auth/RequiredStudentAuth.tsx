import { type ReactNode } from "react";
import { useAuthUser } from "react-auth-kit";
import { Navigate, useLocation } from "react-router-dom";

export default function RequiredStudentAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const user = useAuthUser()();

  if (!user || user.role !== "student") {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

import { type ReactNode } from "react";
import { useAuthUser } from "react-auth-kit";
import { Navigate } from "react-router-dom";

const STAFF_ROLES = new Set(["MESS", "WIFI", "CLEANING", "REPAIR"]);

/**
 * Wraps public pages (login screens). If the user is already authenticated,
 * redirects them to their appropriate dashboard instead of showing the page.
 */
export default function PublicRoute({ children }: { children: ReactNode }) {
  const user = useAuthUser()();

  if (!user) return <>{children}</>;
  if (user.role === "student") return <Navigate to="/dashboard/" replace />;
  if (user.role === "admin")   return <Navigate to="/admin/dashboard/" replace />;
  if (STAFF_ROLES.has(user.role)) return <Navigate to="/staff/dashboard" replace />;

  return <>{children}</>;
}

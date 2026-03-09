import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuthUser, useSignOut } from "react-auth-kit";

// Auth guards
import PublicRoute          from "./components/Auth/PublicRoute";
import RequiredAdminAuth    from "./components/Auth/RequiredAdminAuth";
import RequiredStudentAuth  from "./components/Auth/RequiredStudentAuth";
import RequiredStaffAuth    from "./components/Auth/RequireStaffAuth";

// Auth pages
import Login          from "./components/Auth/Login";
import AdminLogin     from "./components/Auth/AdminLogin";
import StaffLogin     from "./components/Staff/StaffLogin";
import ChangePassword from "./components/Auth/ChangePassword";

// Admin
import AdminDashboard      from "./components/Admin/AdminDashboard";
import { StudentList }     from "./components/Admin/StudentList";
import { Meal }            from "./components/Admin/MealSheet/Meal";
import { Stock }           from "./components/Admin/Stock/Stock";
import Expenses            from "./components/Admin/Expenses";
import { Bills }           from "./components/Admin/Bills/Bills";
import Complaints          from "./components/Admin/Complaints/Complaints";
import BloodBank           from "./components/Admin/BloodBank/BloodBank";
import TotalBill           from "./components/Admin/TotalBill";
import NoticeBoard         from "./components/Admin/NoticeBoard";
import MealRoutineAdmin    from "./components/Student/MealRoutineAdmin";
import TransactionHistory  from "./components/Admin/Transaction History/TransactionHistory";
import Settings            from "./components/Admin/Settings";

// Student
import Dashboard           from "./components/Student/Dashboard";
import MealPlan            from "./components/Student/MealPlan";
import Profile             from "./components/Student/Profile";
import Notice              from "./components/Student/Notice";
import Tution              from "./components/Student/Tution";
import BloodDonate         from "./components/Student/BloodDonate";
import BillPayment         from "./components/Student/BillPayment";
import BillCount           from "./components/Student/BillCount";
import MealRoutine         from "./components/Student/MealRoutine";
import StudentComplaints   from "./components/Student/Complaints/Complaints";
import AddComplaint        from "./components/Student/Complaints/AddComplaint";
import ComplaintDetails    from "./components/Student/Complaints/ComplaintDetails";

// Staff
import StaffDashboard from "./components/Staff/StaffDashboard";

// Navbar (currently renders null — kept for compatibility)
import Navbar from "./components/Common/Navbar";

const STAFF_ROLES = new Set(["MESS", "WIFI", "CLEANING", "REPAIR"]);

/**
 * Listens for the "auth:session-expired" event dispatched by api.js and calls
 * react-auth-kit's signOut() so all auth cookies are cleared with the correct
 * attributes (Secure/SameSite), then navigates to the appropriate login page.
 */
function SessionExpiryHandler() {
  const signOut  = useSignOut();
  const navigate = useNavigate();
  const getUser  = useAuthUser();

  useEffect(() => {
    function handleSessionExpired() {
      const user = getUser();
      const redirectTo =
        user?.role === "admin"          ? "/admin"
        : STAFF_ROLES.has(user?.role)   ? "/staff"
        : "/login";
      signOut();
      navigate(redirectTo, { replace: true });
    }

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, [signOut, navigate, getUser]);

  return null;
}

/** Redirects to the right dashboard when visiting "/" */
function RootRedirect() {
  const user = useAuthUser()();
  if (!user)                      return <Navigate to="/login" replace />;
  if (user.role === "student")    return <Navigate to="/dashboard/" replace />;
  if (user.role === "admin")      return <Navigate to="/admin/dashboard/" replace />;
  if (STAFF_ROLES.has(user.role)) return <Navigate to="/staff/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

/** Catch-all: send authenticated users to their dashboard, others to /login */
function CatchAll() {
  const user = useAuthUser()();
  if (!user)                      return <Navigate to="/login" replace />;
  if (user.role === "student")    return <Navigate to="/dashboard/" replace />;
  if (user.role === "admin")      return <Navigate to="/admin/dashboard/" replace />;
  if (STAFF_ROLES.has(user.role)) return <Navigate to="/staff/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <SessionExpiryHandler />
      <Navbar />
      <Routes>
        {/* ── Root ── */}
        <Route path="/" element={<RootRedirect />} />

        {/* ── Public / login pages ── */}
        <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/admin"  element={<PublicRoute><AdminLogin /></PublicRoute>} />
        <Route path="/staff"  element={<PublicRoute><StaffLogin /></PublicRoute>} />

        {/* ── First-time password change (top-level, outside dashboard layout) ── */}
        <Route
          path="/change-password"
          element={
            <RequiredStudentAuth>
              <ChangePassword />
            </RequiredStudentAuth>
          }
        />

        {/* ── Admin dashboard ── */}
        <Route
          path="/admin/dashboard"
          element={
            <RequiredAdminAuth>
              <AdminDashboard />
            </RequiredAdminAuth>
          }
        >
          <Route index                   element={<StudentList />} />
          <Route path="meal"             element={<Meal />} />
          <Route path="meal-routine"     element={<MealRoutineAdmin />} />
          <Route path="stock"            element={<Stock />} />
          <Route path="transaction-history" element={<TransactionHistory />} />
          <Route path="expenses"         element={<Expenses />} />
          <Route path="bills"            element={<Bills />} />
          <Route path="totalBill"        element={<TotalBill />} />
          <Route path="notice-board"     element={<NoticeBoard />} />
          <Route path="complaints"       element={<Complaints />} />
          <Route path="blood-bank"       element={<BloodBank />} />
          <Route path="settings"         element={<Settings />} />
        </Route>

        {/* ── Student dashboard ── */}
        <Route
          path="/dashboard"
          element={
            <RequiredStudentAuth>
              <Dashboard />
            </RequiredStudentAuth>
          }
        >
          <Route index                                  element={<MealPlan />} />
          <Route path="profile"                         element={<Profile />} />
          <Route path="notice"                          element={<Notice />} />
          <Route path="tution"                          element={<Tution />} />
          <Route path="blood-donate"                    element={<BloodDonate />} />
          <Route path="change-password"                 element={<ChangePassword />} />
          <Route path="bill-payment"                    element={<BillPayment />} />
          <Route path="cost-count"                      element={<BillCount />} />
          <Route path="meal-routine"                    element={<MealRoutine />} />
          <Route path="complaints"                      element={<StudentComplaints />} />
          <Route path="add-complaint"                   element={<AddComplaint />} />
          <Route path="complaints/complaint-details/*"  element={<ComplaintDetails />} />
        </Route>

        {/* ── Staff dashboard ── */}
        <Route
          path="/staff/dashboard"
          element={
            <RequiredStaffAuth>
              <StaffDashboard />
            </RequiredStaffAuth>
          }
        >
          <Route index element={<Complaints />} />
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<CatchAll />} />
      </Routes>
    </>
  );
}

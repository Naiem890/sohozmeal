import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuthUser, useSignOut } from "react-auth-kit";
import { clearCachedToken } from "./api/api";

// Auth guards — kept static (tiny, always needed)
import PublicRoute          from "./components/Auth/PublicRoute";
import RequiredAdminAuth    from "./components/Auth/RequiredAdminAuth";
import RequiredStudentAuth  from "./components/Auth/RequiredStudentAuth";
import RequiredStaffAuth    from "./components/Auth/RequireStaffAuth";

// Navbar (currently renders null — kept for compatibility)
import Navbar from "./components/Common/Navbar";

// ── Lazy-loaded route components ────────────────────────────────────────────

// Auth pages
const Login          = lazy(() => import("./components/Auth/Login"));
const AdminLogin     = lazy(() => import("./components/Auth/AdminLogin"));
const StaffLogin     = lazy(() => import("./components/Staff/StaffLogin"));
const ChangePassword = lazy(() => import("./components/Auth/ChangePassword"));

// Admin layout + pages
const AdminDashboard     = lazy(() => import("./components/Admin/AdminDashboard"));
const StudentList        = lazy(() => import("./components/Admin/StudentList").then(m => ({ default: m.StudentList })));
const Meal               = lazy(() => import("./components/Admin/MealSheet/Meal").then(m => ({ default: m.Meal })));
const Stock              = lazy(() => import("./components/Admin/Stock/Stock").then(m => ({ default: m.Stock })));
const Expenses           = lazy(() => import("./components/Admin/Expenses"));
const Bills              = lazy(() => import("./components/Admin/Bills/Bills").then(m => ({ default: m.Bills })));
const AdminComplaints    = lazy(() => import("./components/Admin/Complaints/Complaints"));
const BloodBank          = lazy(() => import("./components/Admin/BloodBank/BloodBank"));
const TotalBill          = lazy(() => import("./components/Admin/TotalBill"));
const NoticeBoard        = lazy(() => import("./components/Admin/NoticeBoard"));
const MealRoutineAdmin   = lazy(() => import("./components/Student/MealRoutineAdmin"));
const TransactionHistory = lazy(() => import("./components/Admin/Transaction History/TransactionHistory"));
const Settings           = lazy(() => import("./components/Admin/Settings"));
const DataManagement     = lazy(() => import("./components/Admin/DataManagement"));

// Student layout + pages
const Dashboard        = lazy(() => import("./components/Student/Dashboard"));
const MealPlan         = lazy(() => import("./components/Student/MealPlan"));
const Profile          = lazy(() => import("./components/Student/Profile"));
const Notice           = lazy(() => import("./components/Student/Notice"));
const Tution           = lazy(() => import("./components/Student/Tution"));
const BloodDonate      = lazy(() => import("./components/Student/BloodDonate"));
const BillPayment      = lazy(() => import("./components/Student/BillPayment"));
const BillCount        = lazy(() => import("./components/Student/BillCount"));
const MealRoutine      = lazy(() => import("./components/Student/MealRoutine"));
const StudentComplaints = lazy(() => import("./components/Student/Complaints/Complaints"));
const AddComplaint     = lazy(() => import("./components/Student/Complaints/AddComplaint"));
const ComplaintDetails = lazy(() => import("./components/Student/Complaints/ComplaintDetails"));

// Staff
const StaffDashboard = lazy(() => import("./components/Staff/StaffDashboard"));

// ── Loading fallback ─────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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
      clearCachedToken();
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
      <Suspense fallback={<PageLoader />}>
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
          <Route path="complaints"       element={<AdminComplaints />} />
          <Route path="blood-bank"       element={<BloodBank />} />
          <Route path="settings"         element={<Settings />} />
          <Route path="data-management" element={<DataManagement />} />
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
          <Route index element={<AdminComplaints />} />
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<CatchAll />} />
      </Routes>
      </Suspense>
    </>
  );
}

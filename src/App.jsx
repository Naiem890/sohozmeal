import { Route, Routes } from "react-router-dom";
import Dashboard from "./components/Student/Dashboard";
import Navbar from "./components/Common/Navbar";
import RequiredStudentAuth from "./components/Student/RequiredStudentAuth";
import BillPayment from "./components/Student/BillPayment";
import MealRoutine from "./components/Student/MealRoutine";
import MealPlan from "./components/Student/MealPlan";
import Profile from "./components/Student/Profile";
import AdminLogin from "./components/Admin/AdminLogin";
import AdminDashboard from "./components/Admin/AdminDashboard";
import RequiredAdminAuth from "./components/Admin/RequiredAdminAuth";
import Login from "./components/Auth/Login";
import ChangePassword from "./components/Auth/ChangePassword";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/change-password"
          element={
            <RequiredStudentAuth>
              <ChangePassword />
            </RequiredStudentAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequiredStudentAuth>
              <Dashboard />
            </RequiredStudentAuth>
          }
        >
          <Route index element={<MealPlan />} />
          <Route path="profile" element={<Profile />} />

          <Route path="bill-payment" element={<BillPayment />} />
          <Route path="meal-routine" element={<MealRoutine />} />
        </Route>

        <Route
          path="/admin/dashboard"
          element={
            <RequiredAdminAuth>
              <AdminDashboard />
            </RequiredAdminAuth>
          }
        ></Route>
      </Routes>
    </>
  );
}

export default App;

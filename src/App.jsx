import { Route, Routes } from "react-router-dom";
import Dashboard from "./components/Student/Dashboard";
import Navbar from "./components/Common/Navbar";
import RequiredStudentAuth from "./components/Auth/RequiredStudentAuth";
import BillPayment from "./components/Student/BillPayment";
import MealRoutine from "./components/Student/MealRoutine";
import MealPlan from "./components/Student/MealPlan";
import Profile from "./components/Student/Profile";
import AdminLogin from "./components/Auth/AdminLogin";
import AdminDashboard from "./components/Admin/AdminDashboard";
import RequiredAdminAuth from "./components/Auth/RequiredAdminAuth";
import Login from "./components/Auth/Login";
import ChangePassword from "./components/Auth/ChangePassword";
import { StudentList } from "./components/Admin/StudentList";
import { Stock } from "./components/Admin/Stock";
import { Expenses } from "./components/Admin/Expenses";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
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
          path="/admin/dashboard/"
          element={
            <RequiredAdminAuth>
              <AdminDashboard />
            </RequiredAdminAuth>
          }
        >
          <Route index element={<StudentList />} />
          <Route path="stock" element={<Stock />} />
          <Route path="expenses" element={<Expenses />} />
        </Route>
        <Route
          path="/dashboard/"
          element={
            <RequiredStudentAuth>
              <Dashboard />
            </RequiredStudentAuth>
          }
        >
          <Route index element={<MealPlan />} />
          <Route path="profile" element={<Profile />} />
          <Route path="change-password" element={<ChangePassword />} />

          <Route path="bill-payment" element={<BillPayment />} />
          <Route path="meal-routine" element={<MealRoutine />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
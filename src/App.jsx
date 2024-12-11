import { Route, Routes } from "react-router-dom";
import AdminDashboard from "./components/Admin/AdminDashboard";
import Expenses from "./components/Admin/Expenses";
import { Stock } from "./components/Admin/Stock/Stock";
import { StudentList } from "./components/Admin/StudentList";
import AdminLogin from "./components/Auth/AdminLogin";
import ChangePassword from "./components/Auth/ChangePassword";
import Login from "./components/Auth/Login";
import RequiredAdminAuth from "./components/Auth/RequiredAdminAuth";
import RequiredStudentAuth from "./components/Auth/RequiredStudentAuth";
import Navbar from "./components/Common/Navbar";
import BillPayment from "./components/Student/BillPayment";
import Dashboard from "./components/Student/Dashboard";
import MealPlan from "./components/Student/MealPlan";
import MealRoutine from "./components/Student/MealRoutine";
import Profile from "./components/Student/Profile";
import MealRoutineAdmin from "./components/Student/MealRoutineAdmin";
import BillCount from "./components/Student/BillCount";
import TotalBill from "./components/Admin/TotalBill";
import TransactionHistory from "./components/Admin/Transaction History/TransactionHistory";
import { Meal } from "./components/Admin/MealSheet/Meal";
import StaffLogin from "./components/Staff/StaffLogin";
import RequiredStaffAuth from "./components/Auth/RequireStaffAuth";
import StaffDashboard from "./components/Staff/StaffDashboard";
import { Bills } from "./components/Admin/Bills/Bills";
import Complaints from "./components/Admin/Complaints/Complaints";
import StudentComplaints from "./components/Student/Complaints/Complaints";
import BloodBank from "./components/Admin/BloodBank/BloodBank";
import AddComplaint from "./components/Student/Complaints/AddComplaint";
import ComplaintDetails from "./components/Student/Complaints/ComplaintDetails";
import NoticeBoard from "./components/Admin/NoticeBoard";
import Tution from "./components/Student/Tution";
import BloodDonate from "./components/Student/BloodDonate";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/staff" element={<StaffLogin />} />
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
          <Route path="meal" element={<Meal />} />
          <Route path="stock" element={<Stock />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="bills" element={<Bills />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="blood-bank" element={<BloodBank />} />
          <Route path="totalBill" element={<TotalBill />} />
          <Route path="notice-board" element={<NoticeBoard />} />
          <Route path="meal-routine" element={<MealRoutineAdmin />} />
          <Route path="transaction-history" element={<TransactionHistory />} />
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
          <Route path="tution" element={<Tution />} />
          <Route path="blood-donate" element={<BloodDonate />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="bill-payment" element={<BillPayment />} />
          <Route path="cost-count" element={<BillCount />} />
          <Route path="meal-routine" element={<MealRoutine />} />
          <Route path="complaints" element={<StudentComplaints />} />
          <Route path="add-complaint" element={<AddComplaint />} />
          <Route
            path="complaints/complaint-details/*"
            element={<ComplaintDetails />}
          />
        </Route>

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
      </Routes>
    </>
  );
}

export default App;

import { Route, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import RequiredStudentAuth from "./components/RequiredStudentAuth";
import ChangePassword from "./components/ChangePassword";
import BillPayment from "./components/BillPayment";
import MealRoutine from "./components/MealRoutine";
import MealPlan from "./components/MealPlan";
import Profile from "./components/Profile";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
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
      </Routes>
    </>
  );
}

export default App;

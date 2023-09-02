import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminAside from "./AdminAside";

export default function AdminDashboard() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggleDrawer = () => {
    setIsDrawerOpen((prev) => !prev);
  };
  return (
    <div className="drawer lg:drawer-open">
      <input
        id="my-drawer-2"
        type="checkbox"
        checked={isDrawerOpen}
        onChange={toggleDrawer}
        className="drawer-toggle"
      />
      <AdminAside toggleDrawer={toggleDrawer} />
      <div className="drawer-content ">
        <Outlet />
      </div>
    </div>
  );
}

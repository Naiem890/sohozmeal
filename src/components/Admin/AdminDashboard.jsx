import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminAside from "./AdminAside";

export default function AdminDashboard() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // State to manage collapse

  const toggleDrawer = () => {
    setIsDrawerOpen((prev) => !prev);
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev); // Toggle collapse state
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
      <AdminAside
        toggleDrawer={toggleDrawer}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
      />
      {/* Adjust margin dynamically based on the collapsed state */}
      <div className={`drawer-content pr-2 ${isCollapsed ? "ml-24" : "ml-56"}`}>
        <Outlet />
      </div>
    </div>
  );
}

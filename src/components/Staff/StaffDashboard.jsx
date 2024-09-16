import { useState } from "react";
import { Outlet } from "react-router-dom";
import StaffAside from "./StaffAside";

const StaffDashboard = () => {
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
      <StaffAside toggleDrawer={toggleDrawer} />
      <div className="drawer-content md:pl-6">
        <Outlet />
      </div>
    </div>
  );
};

export default StaffDashboard;

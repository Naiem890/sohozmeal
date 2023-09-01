import { useState } from "react";
import Aside from "./Aside";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
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
      <Aside toggleDrawer={toggleDrawer} />
      <div className="drawer-content ">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;

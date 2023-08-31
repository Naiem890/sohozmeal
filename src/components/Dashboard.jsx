// Dashboard.js

import Aside from "./Aside";
import MealCalender from "./MealCalender";

const Dashboard = () => {
  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      {/* <div className="drawer-content flex flex-col items-center justify-center">
        <label
          htmlFor="my-drawer-2"
          className="btn btn-primary drawer-button lg:hidden"
        >
          Open drawer
        </label>
      </div> */}
      <Aside />
      <div className="drawer-content">
        <MealCalender />
      </div>
    </div>
  );
};

export default Dashboard;

import { useState } from "react";
import { Outlet } from "react-router-dom";
import StaffAside from "./StaffAside";
import { Menu } from "lucide-react";

const StaffDashboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const closeDrawer = () => setIsOpen(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <StaffAside isOpen={isOpen} onClose={closeDrawer} />

      {isOpen && (
        <div
          className="fixed inset-0 z-[150] bg-black/40 lg:hidden"
          onClick={closeDrawer}
        />
      )}

      <div className="flex-1 min-w-0 lg:pl-72">
        <div className="sticky top-0 z-[100] lg:hidden flex items-center gap-3 bg-white shadow-sm px-4 py-3 mb-4">
          <button
            onClick={() => setIsOpen((p) => !p)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-700">Staff Portal</span>
        </div>
        <div className="px-4 pb-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;

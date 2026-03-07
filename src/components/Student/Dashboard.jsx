import { useState } from "react";
import Aside from "./Aside";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";

const Dashboard = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Aside isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[150] bg-black/40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 lg:pl-72 flex flex-col">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-[100] lg:hidden flex items-center gap-3 bg-card border-b border-border px-4 h-14 shrink-0">
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <span className="font-semibold text-foreground">Sohoz Meal</span>
        </div>

        <div className="flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

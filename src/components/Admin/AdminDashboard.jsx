import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import AdminAside from "./AdminAside";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const toggleDrawer = () => setMobileOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[199] bg-black/40 lg:hidden"
          onClick={toggleDrawer}
        />
      )}

      <AdminAside
        toggleDrawer={toggleDrawer}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
      />

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-300 min-h-screen",
          isCollapsed ? "lg:pl-[60px]" : "lg:pl-56"
        )}
      >
        {/* Top bar (mobile) */}
        <div className="lg:hidden sticky top-0 z-10 flex items-center gap-3 bg-white border-b border-border px-4 h-14">
          <button
            onClick={toggleDrawer}
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-sm">Sohoz Meal — Admin</span>
        </div>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

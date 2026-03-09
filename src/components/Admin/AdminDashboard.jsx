import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import AdminAside from "./AdminAside";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[199] bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminAside
        isOpen={mobileOpen}
        toggleDrawer={() => setMobileOpen(false)}
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed((v) => !v)}
      />

      {/* Main column */}
      <div
        className={cn(
          "h-screen flex flex-col transition-all duration-300",
          isCollapsed ? "lg:pl-[60px]" : "lg:pl-56"
        )}
      >
        {/* Mobile topbar */}
        <header className="lg:hidden shrink-0 flex items-center gap-3 bg-white border-b border-border px-4 h-14">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-sm">Sohoz Meal — Admin</span>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

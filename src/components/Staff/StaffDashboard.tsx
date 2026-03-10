import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import StaffAside from "./StaffAside";

export default function StaffDashboard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-background flex">
      {/* Sidebar */}
      <StaffAside isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[150] bg-black/40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col h-screen lg:pl-72">
        {/* Mobile topbar */}
        <header className="lg:hidden shrink-0 flex items-center gap-3 bg-card border-b border-border px-4 h-14">
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <span className="font-semibold text-foreground">Staff Portal</span>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

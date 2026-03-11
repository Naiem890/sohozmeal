import { useState } from "react";
import { LogOut, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useSignOut } from "react-auth-kit";
import { toast } from "sonner";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useConfirm } from "../Common/ConfirmDialog";
import { Axios, clearCachedToken } from "../../api/api";
import MISTImage from "../../assets/MIST.png";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const asideLinks = [
  { link: "Complaints", path: "/staff/dashboard/", icon: Users, description: "View and manage complaints" },
];

interface StaffAsideProps {
  isOpen: boolean;
  onClose: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function StaffAside({ isOpen, onClose, onCollapseChange }: StaffAsideProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const signOut = useSignOut();
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm()!;

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    onCollapseChange?.(next);
  };

  const handleSignOut = async () => {
    const ok = await confirm({
      title: "Logout?",
      description: "You will be logged out of Sohoz Meal.",
      confirmText: "Logout",
      cancelText: "Cancel",
    });

    if (ok) {
      try {
        const refreshToken = localStorage.getItem("_refresh_token");
        await Axios.post("/auth/logout", { refreshToken });
        localStorage.removeItem("_refresh_token");
        clearCachedToken();
        signOut();
        navigate("/");
        toast.success("Logged out successfully!");
      } catch {
        // logout proceeds on frontend regardless
      }
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[200] flex flex-col bg-card border-r border-border transition-all duration-300 overflow-hidden",
          isCollapsed ? "w-[60px]" : "w-56",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-border min-h-[64px]">
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <img src={MISTImage} className="w-8 h-8 flex-shrink-0" alt="MIST" />
              <div className="leading-tight overflow-hidden">
                <p className="text-xs font-bold text-foreground truncate">Sohoz Meal</p>
                <p className="text-[10px] text-muted-foreground truncate">Staff Portal</p>
              </div>
            </div>
          )}
          <button
            onClick={toggleCollapse}
            className="ml-auto flex-shrink-0 h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors hidden lg:flex"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {asideLinks.map(({ link, path, icon: Icon, description }) => {
            const isActive = location.pathname === path;
            const item = (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  isCollapsed && "justify-center px-2",
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{link}</span>}
              </Link>
            );
            const tooltipText = isCollapsed ? link : description;
            return tooltipText ? (
              <Tooltip key={path}>
                <TooltipTrigger asChild>{item}</TooltipTrigger>
                <TooltipContent side="right">{tooltipText}</TooltipContent>
              </Tooltip>
            ) : (
              item
            );
          })}
        </nav>

        <div className="border-t border-border px-2 py-3">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className="w-full flex justify-center items-center rounded-lg p-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

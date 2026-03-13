import {
  Users,
  UtensilsCrossed,
  CalendarDays,
  ShoppingBag,
  ArrowLeftRight,
  ShoppingCart,
  FileText,
  Bell,
  MessageSquareWarning,
  Heart,
  Settings,
  HardDrive,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuthUser, useSignOut } from "react-auth-kit";
import { toast } from "sonner";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useConfirm } from "../Common/ConfirmDialog";
import { Axios, clearCachedToken } from "../../api/api";
import mistlogo from "../../assets/MIST.png";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navLinks = [
  { link: "Students", path: "/admin/dashboard/", icon: Users, description: "Manage and view all students" },
  { link: "Meal Sheet", path: "/admin/dashboard/meal", icon: UtensilsCrossed, description: "Daily meal attendance grid" },
  { link: "Routine", path: "/admin/dashboard/meal-routine", icon: CalendarDays, description: "Configure weekly meal menu" },
  { link: "Stock", path: "/admin/dashboard/stock", icon: ShoppingBag, description: "Manage inventory items" },
  { link: "Transactions", path: "/admin/dashboard/transaction-history", icon: ArrowLeftRight, description: "Stock transaction history" },
  { link: "Expenses", path: "/admin/dashboard/expenses", icon: ShoppingCart, description: "Track daily expenses" },
  { link: "Student Bill", path: "/admin/dashboard/bills", icon: FileText, description: "Monthly billing summary" },
  { link: "Notice Board", path: "/admin/dashboard/notice-board", icon: Bell, description: "Post announcements" },
  { link: "Complaints", path: "/admin/dashboard/complaints", icon: MessageSquareWarning, description: "Handle student complaints" },
  { link: "Blood Bank", path: "/admin/dashboard/blood-bank", icon: Heart, description: "Blood donation records" },
  { link: "Settings", path: "/admin/dashboard/settings", icon: Settings, description: "Meal cutoff time & config" },
  { link: "Data", path: "/admin/dashboard/data-management", icon: HardDrive, description: "Backup, restore & purge stock data" },
];

interface AdminAsideProps {
  isOpen: boolean;
  toggleDrawer: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export default function AdminAside({ isOpen, toggleDrawer, isCollapsed, toggleCollapse }: AdminAsideProps) {
  const auth = useAuthUser()();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm()!;

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
          "fixed z-[200] top-0 left-0 h-screen flex flex-col bg-white border-r border-border transition-all duration-300 overflow-hidden",
          isCollapsed ? "w-[60px]" : "w-56",
          // Mobile: slide in/out; desktop: always visible
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-border min-h-[64px]">
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <img src={mistlogo} className="w-8 h-8 flex-shrink-0" alt="MIST" />
              <div className="leading-tight overflow-hidden">
                <p className="text-xs font-bold text-foreground truncate">Sohoz Meal</p>
                <p className="text-[10px] text-muted-foreground truncate">{auth?.wing} Wing</p>
              </div>
            </div>
          )}
          <button
            onClick={toggleCollapse}
            className="ml-auto flex-shrink-0 h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navLinks.map(({ link, path, icon: Icon, description }) => {
            const isActive = location.pathname === path;
            const item = (
              <Link
                key={path}
                to={path}
                onClick={toggleDrawer}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  isCollapsed && "justify-center px-2",
                  isActive
                    ? "bg-primary/10 text-primary"
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

        {/* Footer */}
        <div className="border-t border-border px-2 py-3">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className="w-full flex justify-center items-center rounded-lg p-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
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

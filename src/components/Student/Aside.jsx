import { useSignOut } from "react-auth-kit";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useConfirm } from "../Common/ConfirmDialog";
import { Axios } from "../../api/api";
import {
  LogOut,
  UtensilsCrossed,
  Calculator,
  User,
  Bell,
  Table2,
} from "lucide-react";
import Logo from "../Common/Logo";
import MISTImage from "../../assets/MIST.png";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Meal Plan",    path: "/dashboard/",            icon: UtensilsCrossed },
  { label: "Meal Routine", path: "/dashboard/meal-routine", icon: Table2 },
  { label: "Bill Count",   path: "/dashboard/cost-count",   icon: Calculator },
  { label: "Profile",      path: "/dashboard/profile",       icon: User },
  { label: "Notice",       path: "/dashboard/notice",        icon: Bell },
];

export default function Aside({ isOpen, onClose }) {
  const signOut = useSignOut();
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();

  const handleSignOut = async () => {
    const ok = await confirm({
      title: "Logout?",
      description: "You will be logged out of Sohoz Meal.",
      confirmText: "Logout",
      cancelText: "Cancel",
    });
    if (ok) {
      try {
        await Axios.post("/auth/logout", {});
        localStorage.clear();
        signOut();
        navigate("/");
        toast.success("Logged out successfully!");
      } catch (error) {
        console.error(error);
      }
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-[200] flex flex-col w-72 bg-card border-r border-border transition-transform duration-300",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-border">
        <Logo
          logo={MISTImage}
          alt="Osmany Hall"
          title="Sohoz Meal (MIST)"
          subTitle="Student Portal"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-3">
          {navLinks.map(({ label, path, icon: Icon }) => (
            <li key={path}>
              <Link
                to={path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(path)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-3">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}

import { LogOut, Users } from "lucide-react";
import { useSignOut } from "react-auth-kit";
import { toast } from "sonner";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useConfirm } from "../Common/ConfirmDialog";
import { Axios } from "../../api/api";
import MISTImage from "../../assets/MIST.png";
import Logo from "../Common/Logo";
import { cn } from "@/lib/utils";

export default function StaffAside({ isOpen, onClose }) {
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
        localStorage.removeItem("_refresh_token");
        signOut();
        navigate("/");
        toast.success("Logged out successfully!");
      } catch (error) {
        console.log(error);
      }
    }
  };

  const asideLinks = [
    { link: "Complaints", path: "/staff/dashboard/", icon: <Users className="h-5 w-5" /> },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-[200] flex flex-col w-72 bg-card border-r border-border transition-transform duration-300",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="py-8 px-6 border-b">
        <Logo
          logo={MISTImage}
          alt="Osmany Hall"
          title="Sohoz Meal (MIST)"
          subTitle="Staff Portal"
        />
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {asideLinks.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === link.path
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {link.icon}
                <span>{link.link}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t p-3">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

import {
  ArrowRightOnRectangleIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TableCellsIcon,
  UserGroupIcon,
  CurrencyBangladeshiIcon,
  PencilIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useAuthUser, useSignOut } from "react-auth-kit";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { Axios } from "../../api/api";
import mistlogo from "../../assets/MIST.png";

export default function AdminAside({
  toggleDrawer,
  isCollapsed,
  toggleCollapse,
}) {
  const auth = useAuthUser()();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle SignOut confirmation and logic
  const handleSignOut = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to logout from Sohoz Meal?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Logout!",
    });

    if (result.isConfirmed) {
      try {
        await Axios.post("/auth/logout", {});
        localStorage.clear();
        signOut();
        navigate("/");
        toast.success("Logged out successfully!");
      } catch (error) {
        console.error("Logout error: ", error);
      }
    }
  };

  // Sidebar links
  const asideLinks = [
    {
      link: "Students",
      path: "/admin/dashboard/",
      icon: <UserGroupIcon className="h-6 w-6" />,
    },
    {
      link: "Meal",
      path: "/admin/dashboard/meal",
      icon: <PencilIcon className="h-6 w-6" />,
    },
    {
      link: "Routine",
      path: "/admin/dashboard/meal-routine",
      icon: <TableCellsIcon className="w-6 h-6" />,
    },
    {
      link: "Stock",
      path: "/admin/dashboard/stock",
      icon: <ShoppingBagIcon className="h-6 w-6" />,
    },
    {
      link: "Transaction",
      path: "/admin/dashboard/transaction-history",
      icon: <CurrencyBangladeshiIcon className="h-6 w-6" />,
    },
    {
      link: "Expenses",
      path: "/admin/dashboard/expenses",
      icon: <ShoppingCartIcon className="h-6 w-6" />,
    },
    {
      link: "Student Bill",
      path: "/admin/dashboard/bills",
      icon: <DocumentTextIcon className="h-6 w-6" />,
    },
  ];

  return (
    <div
      className={`fixed z-[200] top-0 left-0 ${
        isCollapsed ? "w-20" : "w-52"
      } bg-[#f6f6f6] h-screen overflow-y-auto overflow-x-hidden transition-all duration-300`}
    >
      {/* Collapse Button */}
      <div className=" py-4 px-6 flex justify-end items-center">
        <button onClick={toggleCollapse} className="btn btn-circle btn-sm">
          {isCollapsed ? (
            <ChevronDoubleRightIcon className="h-6 w-6" />
          ) : (
            <ChevronDoubleLeftIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="flex justify-between items-center mb-4 px-2">
          <div>
            <img src={mistlogo} className="w-24" />
          </div>
          <div>
            <h2 className="font-bold text-3xl text-end text-black opacity-50">
              Admin
            </h2>
            <h2 className="font-thin text-end text-black opacity-50">
              {`${auth.wing}`} Wing
            </h2>
          </div>
        </div>
      )}

      {/* Links */}
      <ul className="menu flex flex-col p-0 text-base-content font-medium">
        {asideLinks.map((link, index) => {
          const isActive = location.pathname === link.path;
          return (
            <li key={index} className="px-4 text-base">
              <Link
                to={link.path}
                onClick={toggleDrawer}
                className={`py-4 rounded-lg flex items-center transition-all duration-200 ${
                  isActive
                    ? "bg-gray-300 shadow-md"
                    : "text-gray-600 hover:bg-white hover:shadow-md"
                }`}
              >
                {link.icon}
                {/* Show text only when not collapsed */}
                {!isCollapsed && <span className="ml-2">{link.link}</span>}
              </Link>
            </li>
          );
        })}

        {/* Sign Out Button */}
        <li className="px-4 text-base">
          <button
            onClick={handleSignOut}
            className="py-4 rounded-lg text-red-600 hover:text-white hover:bg-red-600 flex items-center transition-all duration-200"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </button>
        </li>
      </ul>
    </div>
  );
}

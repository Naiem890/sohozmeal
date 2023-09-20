import { useSignOut } from "react-auth-kit";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Axios } from "../../api/api";
import {
  ArrowRightOnRectangleIcon,
  CreditCardIcon,
  TableCellsIcon,
  UserCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { MealIcon } from "../../assets/Icons";

export default function Aside({ toggleDrawer }) {
  // const auth = useAuthUser();
  const signOut = useSignOut();
  const navigate = useNavigate();

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
        const logout = await Axios.post("/auth/logout", "");
        localStorage.clear();
        signOut();
        navigate("/");
        toast.success("Logged out successfully!");
      } catch (error) {
        console.log(error);
      }
    }
  };

  const asideLinks = [
    {
      link: "Meal Plan",
      path: "/dashboard/",
      icon: <MealIcon />,
    },
    {
      link: "Meal Routine",
      path: "/dashboard/meal-routine",
      icon: <TableCellsIcon className="w-6 h-6" />,
    },
    {
      link: "Bill Payment",
      path: "/dashboard/bill-payment",
      icon: <CreditCardIcon className="h-6 w-6" />,
    },
    {
      link: "Profile",
      path: "/dashboard/profile",
      icon: <UserCircleIcon className="h-6 w-6" />,
    },
  ];

  return (
    <div className="drawer-side z-50">
      <label htmlFor="my-drawer-2" className="drawer-overlay"></label>
      <ul className="menu  flex flex-col p-0 w-60 min-h-full bg-base-200 text-base-content font-medium">
        <div className="flex menu-title justify-center items-center text-xl h-14 text-white mb-4 bg-green-700">
          Sohoz Meal
        </div>
        {asideLinks.map((link, index) => (
          <li key={index} className="px-2">
            <Link
              to={link.path}
              onClick={toggleDrawer}
              className="active:!bg-gray-200 drawer-overlay active:!text-black"
            >
              {link.icon}
              <span className="ml-2">{link.link}</span>
            </Link>
          </li>
        ))}

        <li className="px-2">
          <button
            onClick={handleSignOut}
            className="active:!bg-red-600 active:text-white text-red-600 hover:text-white hover:bg-red-600"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            <span className="ml-2">Logout</span>
          </button>
        </li>
      </ul>
    </div>
  );
}

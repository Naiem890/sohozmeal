import {
  ArrowRightOnRectangleIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TableCellsIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useSignOut } from "react-auth-kit";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Axios } from "../../api/api";
import MISTImage from "../../assets/MIST.png";
import Logo from "../Common/Logo";

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
        const logout = await Axios.post("/auth/logout", {});
        console.log(logout);
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
      link: "All Students",
      path: "/admin/dashboard/",
      icon: <UserGroupIcon className="h-6 w-6" />,
    },
    {
      link: "Meal Routine",
      path: "/admin/dashboard/meal-routine",
      icon: <TableCellsIcon className="w-6 h-6" />,
    },
    {
      link: "Stock",
      path: "/admin/dashboard/stock",
      icon: <ShoppingBagIcon className="h-6 w-6" />,
    },
    {
      link: "Total Bill",
      path: "/admin/dashboard/totalBill",
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
    },
    {
      link: "Expenses",
      path: "/admin/dashboard/expenses",
      icon: <ShoppingCartIcon className="h-6 w-6" />,
    },
  ];

  return (
    <div className="drawer-side z-[200]">
      <label htmlFor="my-drawer-2" className="drawer-overlay"></label>
      <ul className="menu  flex flex-col p-0 w-72 sm:w-80 min-h-full bg-[#f6f6f6] text-base-content font-medium">
        <div className="menu-title py-10 px-6">
          <Logo
            logo={MISTImage}
            alt="Osmany Hall"
            title="Sohoz Meal (MIST)"
            subTitle="Admin Portal"
          />
        </div>
        {/* <div className="divider"></div> */}
        {asideLinks.map((link, index) => (
          <li key={index} className="px-4 text-base">
            <Link
              to={link.path}
              onClick={toggleDrawer}
              className="active:!bg-white drawer-overlay py-4 hover:bg-white rounded-lg  hover:shadow-md active:!text-black"
            >
              {link.icon}
              <span className="ml-2">{link.link}</span>
            </Link>
          </li>
        ))}

        <li className="px-4 text-base">
          <button
            onClick={handleSignOut}
            className="active:!bg-red-600 py-4 active:text-white rounded-lg text-red-600 hover:text-white hover:bg-red-600"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            <span className="ml-2">Logout</span>
          </button>
        </li>
      </ul>
    </div>
  );
}

import { Bars3CenterLeftIcon } from "@heroicons/react/24/outline";
import { useAuthUser, useSignOut } from "react-auth-kit";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Navbar() {
  const auth = useAuthUser();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const location = useLocation();

  const isStudent = auth()?.role === "student";
  const isAuthenticated = auth()?.isAuthenticated;
  const navLinks = [
    // { link: "Home", path: "/" },
    // { link: "Home", path: "/" },
    // { link: "Home", path: "/" },
    // { link: "Home", path: "/" },
  ];
  console.log("location", location);

  const showNavBar = location.pathname.includes("dashboard");

  console.log("showNavBar", showNavBar);

  return (
    <div
      className={`lg:hidden navbar flex shadow-md mb-8 px-4 sticky top-0 z-[100] bg-white ${
        !showNavBar && "hidden"
      }`}
    >
      <label
        htmlFor="my-drawer-2"
        className="drawer-button w-12 h-12 rounded-lg flex justify-center items-center border border-gray-200 lg:hidden"
      >
        <Bars3CenterLeftIcon className="h-6 w-6" />
      </label>
    </div>
  );
}

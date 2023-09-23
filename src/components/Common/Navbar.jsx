import { useAuthUser, useSignOut } from "react-auth-kit";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Navbar() {
  const auth = useAuthUser();
  const signOut = useSignOut();
  const navigate = useNavigate();

  const isStudent = auth()?.role === "student";
  const isAuthenticated = auth()?.isAuthenticated;
  const navLinks = [
    // { link: "Home", path: "/" },
    // { link: "Home", path: "/" },
    // { link: "Home", path: "/" },
    // { link: "Home", path: "/" },
  ];

  return (
    <div className="lg:hidden navbar bg-base-100 lg:px-12">
      <div className="navbar-start">
        <label
          htmlFor="my-drawer-2"
          className="btn bg-emerald-700 text-white drawer-button lg:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h8m-8 6h16"
            />
          </svg>
        </label>
      </div>
    </div>
  );
}

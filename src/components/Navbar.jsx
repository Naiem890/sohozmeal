export default function Navbar() {
  const navLinks = [
    // { link: "Home", path: "/" },
    // { link: "Home", path: "/" },
    // { link: "Home", path: "/" },
    // { link: "Home", path: "/" },
  ];

  return (
    <div className="navbar bg-base-100 lg:px-12">
      <div className="navbar-start">
        <a className="btn btn-ghost normal-case text-xl">S-MEAL</a>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {navLinks.map((link) => (
            <li key={link.path}>
              <a href={link.path}>{link.link}</a>
            </li>
          ))}
        </ul>
      </div>
      <div className="navbar-end">
        <a className="btn btn-primary lg:flex hidden">Login</a>
        <div className="dropdown lg:hidden">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
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
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 right-0 shadow bg-base-100 rounded-box w-32"
          >
            {navLinks.map((link) => (
              <li key={link.path}>
                <a href={link.path}>{link.link}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

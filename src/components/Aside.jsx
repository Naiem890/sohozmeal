export default function Aside() {
  return (
    <div className="drawer-side">
      <label htmlFor="my-drawer-2" className="drawer-overlay"></label>
      <ul className="menu p-4 w-80 min-h-full bg-base-200 text-base-content text-lg font-medium">
        {/* Sidebar content here */}
        <li>
          <a>Meal Info</a>
        </li>
        <li>
          <a>Mess Bill</a>
        </li>
      </ul>
    </div>
  );
}

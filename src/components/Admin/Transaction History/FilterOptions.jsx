import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState, useEffect, useRef } from "react";

const FilterOptions = ({
  transactionType,
  mealType,
  toggleTransactionType,
  setMealType,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Track dropdown state
  const dropdownRef = useRef(null); // Reference to the dropdown container

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev); // Toggle dropdown open/close
  };

  const handleSelectMeal = (meal) => {
    setMealType(meal);
    setIsDropdownOpen(false); // Close the dropdown after selecting
  };

  // Close the dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false); // Close dropdown if clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup the event listener when the component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="flex justify-between">
      <div className="flex items-center gap-2">
        <span>Transaction Type</span>
        <button
          className="btn btn-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 px-4 py-2 font-thin"
          onClick={toggleTransactionType}
          style={{ lineHeight: "1rem", fontSize: "0.75rem" }}
        >
          {transactionType}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span>Meal</span>
        <div className="relative" ref={dropdownRef}>
          {" "}
          {/* Ensure the parent has relative positioning */}
          <label
            tabIndex={0}
            className="btn btn-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 px-4 py-2 font-thin text-xs flex items-center"
            style={{ lineHeight: "1rem" }}
            onClick={toggleDropdown}
          >
            {mealType === "ALL"
              ? "Select Meal"
              : mealType.charAt(0).toUpperCase() +
                mealType.slice(1).toLowerCase()}
            <ChevronDownIcon
              className={`w-4 h-4 ml-2 transform transition-transform duration-300 ${
                isDropdownOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </label>
          <ul
            tabIndex={0}
            className={`absolute z-50 right-0 dropdown-content menu p-2 shadow rounded-box bg-emerald-100 w-52 mt-2 ${
              isDropdownOpen ? "block" : "hidden"
            }`}
          >
            <li>
              <a onClick={() => handleSelectMeal("ALL")}>All</a>
            </li>
            <li>
              <a onClick={() => handleSelectMeal("BREAKFAST")}>Breakfast</a>
            </li>
            <li>
              <a onClick={() => handleSelectMeal("LUNCH")}>Lunch</a>
            </li>
            <li>
              <a onClick={() => handleSelectMeal("DINNER")}>Dinner</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FilterOptions;

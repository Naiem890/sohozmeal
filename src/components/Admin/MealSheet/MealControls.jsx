import React from "react";
import ReactDatePicker from "react-datepicker";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export const MealControls = ({
  fromDate,
  setFromDate,
  generateMeal,
  exportToExcel,
}) => {
  return (
    <div className="flex justify-between items-center mt-2">
      <h2 className=" text-2xl font-semibold">Meal Sheet</h2>
      <div className="flex">
        <h3
          className="text-md font-bold bg-emerald-500 px-4 py-2 text-white rounded-lg hover:bg-emerald-600 cursor-pointer transition-all duration-300 hover:ring-1 ring-offset-2 ring-emerald-500"
          onClick={generateMeal}
        >
          Generate Meal
        </h3>
        <ReactDatePicker
          selected={fromDate}
          onChange={(date) => setFromDate(date)}
          className="rounded-lg inline-block ml-2"
        />
        <button
          className="bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 px-2 py-2 font-thin hover:ring-1 ring-offset-2 ring-emerald-500 transition-all duration-300 ml-2"
          style={{ fontSize: "0.7rem" }}
          onClick={exportToExcel}
        >
          <ArrowDownTrayIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

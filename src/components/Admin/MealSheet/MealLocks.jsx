import React from "react";

export const MealLocks = ({
  breakfastLock,
  lunchLock,
  dinnerLock,
  breakfastFeast,
  lunchFeast,
  dinnerFeast,
  handleMealLock,
}) => {
  return (
    <div className="flex flex-row w-full justify-evenly">
      <h3
        className={`text-sm font-bold ${
          breakfastFeast
            ? "bg-green-400 text-white"
            : breakfastLock
            ? "bg-red-500 text-white"
            : "bg-gray-100"
        } px-2 py-1 text-gray-400 rounded-lg cursor-pointer transition-all duration-300 ml-2`}
        onClick={() => handleMealLock("breakfast")}
      >
        B
      </h3>
      <h3
        className={`text-sm font-bold ${
          lunchFeast
            ? "bg-green-400 text-white"
            : lunchLock
            ? "bg-red-500 text-white"
            : "bg-gray-100"
        } px-2 py-1 text-gray-400 rounded-lg cursor-pointer transition-all duration-300`}
        onClick={() => handleMealLock("lunch")}
      >
        L
      </h3>
      <h3
        className={`text-sm font-bold ${
          dinnerFeast
            ? "bg-green-400 text-white"
            : dinnerLock
            ? "bg-red-500 text-white"
            : "bg-gray-100"
        } px-2 py-1 text-gray-400 rounded-lg cursor-pointer transition-all duration-300 mr-2`}
        onClick={() => handleMealLock("dinner")}
      >
        D
      </h3>
    </div>
  );
};

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
    <div className="text-center space-x-4">
      <button
        className={`text-sm font-bold w-8 h-8 ${
          breakfastFeast
            ? "bg-green-400 text-white"
            : breakfastLock
            ? "bg-red-500 text-white"
            : "bg-gray-100"
        } rounded-lg cursor-pointer transition-all duration-300`}
        onClick={() => handleMealLock("breakfast")}
      >
        B
      </button>
      <button
        className={`text-sm font-bold w-8 h-8 ${
          lunchFeast
            ? "bg-green-400 text-white"
            : lunchLock
            ? "bg-red-500 text-white"
            : "bg-gray-100"
        } rounded-lg cursor-pointer transition-all duration-300`}
        onClick={() => handleMealLock("lunch")}
      >
        L
      </button>
      <button
        className={`text-sm font-bold w-8 h-8 ${
          dinnerFeast
            ? "bg-green-400 text-white"
            : dinnerLock
            ? "bg-red-500 text-white"
            : "bg-gray-100"
        } rounded-lg cursor-pointer transition-all duration-300`}
        onClick={() => handleMealLock("dinner")}
      >
        D
      </button>
    </div>
  );
};

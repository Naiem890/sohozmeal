import React from "react";
import toast from "react-hot-toast";

export const MealRow = ({
  student,
  breakfastFeast,
  lunchFeast,
  dinnerFeast,
}) => {
  const handleMealToggle = (studentId, mealType) => {
    toast.success(`Meal ${mealType} toggled for student ${studentId}`);
  };

  return (
    <tr className="hover:shadow-sm rounded-lg hover:bg-emerald-50 transition-all border-b-0">
      <td>{student.hallId}</td>
      <td>{student.studentId}</td>
      <td>{student.name}</td>
      <td>{student.roomNo}</td>
      <td>{student.residence}</td>
      <td className="flex gap-4 justify-center">
        <button
          onClick={() => handleMealToggle(student._id, "breakfast")}
          className={`rounded-full w-10 h-10 transition-all ${
            breakfastFeast || student?.meal?.breakfast
              ? "bg-green-400 text-white"
              : "bg-transparent border-2 border-green-300"
          }`}
        >
          B
        </button>
        <button
          onClick={() => handleMealToggle(student._id, "lunch")}
          className={`rounded-full w-10 h-10 transition-all ${
            lunchFeast || student?.meal?.lunch
              ? "bg-green-400 text-white"
              : "bg-transparent border-2 border-green-300"
          }`}
        >
          L
        </button>
        <button
          onClick={() => handleMealToggle(student._id, "dinner")}
          className={`rounded-full w-10 h-10 transition-all ${
            dinnerFeast || student?.meal?.dinner
              ? "bg-green-400 text-white"
              : "bg-transparent border-2 border-green-300"
          }`}
        >
          D
        </button>
      </td>
    </tr>
  );
};

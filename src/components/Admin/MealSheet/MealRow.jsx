import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Axios } from "../../../api/api";

export const MealRow = ({
  student: initialStudent,
  setStudents,
  breakfastFeast,
  lunchFeast,
  dinnerFeast,
  date,
}) => {
  // Create local state to hold the student data
  const [student, setStudent] = useState(initialStudent);

  // When the 'initialStudent' prop changes, update the local 'student' state
  useEffect(() => {
    setStudent(initialStudent);
  }, [initialStudent]);

  // Function to handle meal toggle and update state
  const handleMealToggle = async (studentId, meal, wing) => {
    try {
      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, "0"); // Ensure 2 digits for month
      const day = dateObj.getDate().toString().padStart(2, "0"); // Ensure 2 digits for day
      const dateString = `${year}-${month}-${day}`;

      const res = await Axios.put(
        `/meal/toggle?studentId=${studentId}&meal=${meal}&wing=${wing}&date=${dateString}`
      );
      const updatedStudent = {
        ...student,
        meal: {
          ...student.meal,
          breakfast: res?.data?.meal?.meal?.breakfast,
          lunch: res?.data?.meal?.meal?.lunch,
          dinner: res?.data?.meal?.meal?.dinner,
        },
      };

      // Update the student meal data
      setStudent(updatedStudent);

      setStudents((prevStudents) =>
        prevStudents.map((s) =>
          s.studentId === studentId ? updatedStudent : s
        )
      );

      toast.success(`Meal ${meal} toggled for student ${studentId}`);
    } catch (e) {
      console.error(e);
      toast.error(`Failed to toggle meal ${meal}`);
    }
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
          onClick={() =>
            handleMealToggle(student.studentId, "breakfast", student.gender)
          }
          className={`rounded-full w-10 h-10 transition-all ${
            breakfastFeast || student?.meal?.breakfast
              ? "bg-green-400 text-white"
              : "bg-transparent border-2 border-green-300"
          }`}
        >
          B
        </button>
        <button
          onClick={() =>
            handleMealToggle(student.studentId, "lunch", student.gender)
          }
          className={`rounded-full w-10 h-10 transition-all ${
            lunchFeast || student?.meal?.lunch
              ? "bg-green-400 text-white"
              : "bg-transparent border-2 border-green-300"
          }`}
        >
          L
        </button>
        <button
          onClick={() =>
            handleMealToggle(student.studentId, "dinner", student.gender)
          }
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

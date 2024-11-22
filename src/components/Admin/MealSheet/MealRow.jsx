import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Axios } from "../../../api/api";
import {
  CheckIcon,
  TicketIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { formatDateTime } from "../../../Utils/formatDateString";
import { dateToYYYYMMDD } from "../../../Utils/dateToYYYYMMDD";
import Swal from "sweetalert2";

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

  const handleGuestMealChange = (e) => {
    const { value, name } = e.target;

    // Convert empty value to null, otherwise parse the number
    const parsedValue = value === "" ? null : Number(value);

    const updatedStudent = {
      ...student,
      guestMeal: {
        ...student.guestMeal,
        [name]: parsedValue,
      },
    };

    setStudent(updatedStudent);
  };

  const handleSubmitGuestMeal = async () => {
    const { breakfast, lunch, dinner } = student.guestMeal;

    try {
      // Show confirmation dialog with meal counts
      const result = await Swal.fire({
        title: "Confirm Guest Meal Update",
        html: `
          <p>Breakfast: <strong>${breakfast ?? 0}</strong></p>
          <p>Lunch: <strong>${lunch ?? 0}</strong></p>
          <p>Dinner: <strong>${dinner ?? 0}</strong></p>
          <p>Do you want to proceed with this update?</p>
        `,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Yes, Update",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) {
        return;
      }

      const formattedDate = dateToYYYYMMDD(date);

      // API call to update guest meal
      const res = await Axios.put("/meal/guest-meal", {
        studentId: student.studentId,
        guestMeal: student.guestMeal,
        date: formattedDate,
      });

      const updatedStudent = {
        ...student,
        guestMeal: res?.data?.guestMeal,
      };

      // Update local state
      setStudent(updatedStudent);

      setStudents((prevStudents) =>
        prevStudents.map((s) =>
          s.studentId === student.studentId ? updatedStudent : s
        )
      );

      toast.success("Guest meal updated successfully");
    } catch (err) {
      console.error("Error updating guest meal:", err);
      toast.error("Failed to update guest meal. Please try again.");
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
      <td className="">
        <div className="grid grid-cols-4 gap-1 w-full place-items-center">
          <input
            key={`${student?.studentId}-breakfast`}
            name="breakfast"
            type="number"
            min={0}
            step={1}
            value={student?.guestMeal?.breakfast}
            onChange={handleGuestMealChange}
            placeholder="Breakfast"
            className="input input-bordered focus:outline-1 focus:ring-green-500 rounded-lg input-success w-20 h-10 placeholder:text-xs"
          />
          <input
            key={`${student?.studentId}-lunch`}
            name="lunch"
            type="number"
            min={0}
            step={1}
            value={student?.guestMeal?.lunch}
            onChange={handleGuestMealChange}
            placeholder="Lunch"
            className="input input-bordered focus:outline-1 focus:ring-green-500 rounded-lg input-success w-20 h-10 placeholder:text-xs"
          />
          <input
            key={`${student?.studentId}-dinner`}
            name="dinner"
            type="number"
            min={0}
            step={1}
            value={student?.guestMeal?.dinner}
            onChange={handleGuestMealChange}
            placeholder="Dinner"
            className="input input-bordered focus:outline-1 focus:ring-green-500 rounded-lg input-success w-20 h-10 placeholder:text-xs"
          />
          <div
            className="tooltip hover:tooltip-open tooltip-left"
            data-tip="Submit Guest Meal"
          >
            <CheckCircleIcon
              className="cursor-pointer text-green-500 hover:text-green-800 transition-colors duration-500"
              width={40}
              onClick={handleSubmitGuestMeal}
            />
          </div>
        </div>
      </td>
    </tr>
  );
};

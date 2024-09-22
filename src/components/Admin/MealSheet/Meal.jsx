import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import { MealTable } from "./MealTable";
import { MealStats } from "./MealStats";
import { Axios } from "../../../api/api";
import { MealControls } from "./MealControls";
import Swal from "sweetalert2";

export const Meal = () => {
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("roomNo");
  const [sortAsc, setSortAsc] = useState(true);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [gender, setGender] = useState("MALE");
  const [residence, setResidence] = useState("");
  const [search, setSearch] = useState("");
  const [refetch, setRefetch] = useState(false);

  const [breakfastCount, setBreakfastCount] = useState(0);
  const [lunchCount, setLunchCount] = useState(0);
  const [dinnerCount, setDinnerCount] = useState(0);

  const [breakfastLock, setBreakfastLock] = useState(false);
  const [lunchLock, setLunchLock] = useState(false);
  const [dinnerLock, setDinnerLock] = useState(false);

  const [breakfastFeast, setBreakfastFeast] = useState(false);
  const [lunchFeast, setLunchFeast] = useState(false);
  const [dinnerFeast, setDinnerFeast] = useState(false);

  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);
    return nextDay;
  });

  const formatDate = (date) => {
    const adjustedDate = new Date(date);
    adjustedDate.setHours(0, 0, 0, 0);

    const year = adjustedDate.getFullYear();
    const month = String(adjustedDate.getMonth() + 1).padStart(2, "0");
    const day = String(adjustedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    Swal.fire({
      title: "Loading...",
      text: "Please wait while we load the data.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Fetch feast locks and students, and set loading to false when done
    Promise.all([fetchFeastLocks(), fetchStudents()])
      .then(() => {
        setLoading(false); // Set loading to false after data is loaded
        Swal.close(); // Close SweetAlert loading screen
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Failed to load data",
          text: "An error occurred while loading the data.",
        });
      });

    async function fetchFeastLocks() {
      try {
        const formattedDate = formatDate(fromDate);
        const result = await Axios.get(
          `/feast/date/${formattedDate}/wing/${gender}`
        );
        if (result.data.length > 0) {
          setBreakfastLock(result.data[0].meal.includes("breakfast"));
          setLunchLock(result.data[0].meal.includes("lunch"));
          setDinnerLock(result.data[0].meal.includes("dinner"));

          setBreakfastFeast(result.data[0].meal.includes("breakfast"));
          setLunchFeast(result.data[0].meal.includes("lunch"));
          setDinnerFeast(result.data[0].meal.includes("dinner"));
        } else {
          resetFeastLocks();
        }
      } catch (error) {
        resetFeastLocks();
        console.error("Error fetching feast locks:", error);
      }
    }

    function resetFeastLocks() {
      setBreakfastLock(false);
      setLunchLock(false);
      setDinnerLock(false);

      setBreakfastFeast(false);
      setLunchFeast(false);
      setDinnerFeast(false);
    }

    async function fetchStudents() {
      const formattedDate = formatDate(fromDate);
      const result = await Axios.get("/meal/students", {
        params: { date: formattedDate, gender: gender }, // gender is used as wing
      });
      setStudents(result.data);
    }
  }, [fromDate, gender]);

  useEffect(() => {
    let breakfast = 0;
    let lunch = 0;
    let dinner = 0;

    students.forEach((student) => {
      if (student?.meal?.breakfast || breakfastFeast) breakfast++;
      if (student?.meal?.lunch || lunchFeast) lunch++;
      if (student?.meal?.dinner || dinnerFeast) dinner++;
    });

    setBreakfastCount(breakfast);
    setLunchCount(lunch);
    setDinnerCount(dinner);
  }, [students, breakfastFeast, lunchFeast, dinnerFeast]);

  useEffect(() => {
    const filteredResult = students
      .filter(
        (student) =>
          search === "" ||
          student.studentId.toLowerCase().includes(search.toLowerCase()) ||
          student.hallId.toLowerCase().includes(search.toLowerCase()) ||
          student.name.toLowerCase().includes(search.toLowerCase())
      )
      .filter((student) => gender === "" || student.gender === gender)
      .filter((student) => residence === "" || student.residence === residence);

    if (sortBy) {
      filteredResult.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortAsc ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortAsc ? 1 : -1;
        return 0;
      });
    }

    setFilteredStudents(filteredResult);
  }, [sortBy, sortAsc, search, students, gender, residence]);

  const exportToExcel = () => {
    const excelData = filteredStudents.map((student) => ({
      "Hall ID": student.hallId,
      "Student ID": student.studentId,
      Name: student.name,
      "Room No": student.roomNo,
      Residence: student.residence,
      Breakfast: breakfastFeast || student?.meal?.breakfast ? "✓" : "",
      Lunch: lunchFeast || student?.meal?.lunch ? "✓" : "",
      Dinner: dinnerFeast || student?.meal?.dinner ? "✓" : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Meal Data");

    const formattedDate = formatDate(fromDate);
    const fileName = `${formattedDate}_${gender}_wing_${
      residence || "all"
    }_meal_sheet.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  const handleMealLock = async (mealType) => {
    const formattedDate = formatDate(fromDate);

    try {
      const checkResult = await Axios.post("/feast/check", {
        date: formattedDate,
        meal: mealType,
        wing: gender, // Pass wing as gender
      });
      console.log(checkResult.data, "kksk");
      const isFeastOn = checkResult.data.status === "on";

      if (isFeastOn) {
        await Axios.delete(
          `/feast/date/${formattedDate}/meal/${mealType}/wing/${gender}`
        );
        toast.success(
          `Hall feast for ${mealType} on ${formattedDate} turned off!`
        );

        if (mealType === "breakfast") {
          setBreakfastLock(false);
          setBreakfastFeast(false);
        } else if (mealType === "lunch") {
          setLunchLock(false);
          setLunchFeast(false);
        } else if (mealType === "dinner") {
          setDinnerLock(false);
          setDinnerFeast(false);
        }
      } else {
        await Axios.post("/feast", {
          date: formattedDate,
          meal: mealType,
          wing: gender, // Pass wing as gender
        });
        toast.success(
          `Hall feast for ${mealType} on ${formattedDate} turned on!`
        );

        if (mealType === "breakfast") {
          setBreakfastLock(true);
          setBreakfastFeast(true);
        } else if (mealType === "lunch") {
          setLunchLock(true);
          setLunchFeast(true);
        } else if (mealType === "dinner") {
          setDinnerLock(true);
          setDinnerFeast(true);
        }
      }
    } catch (error) {
      toast.error(`Failed to update ${mealType} lock status`);
      console.error(error);
    }
  };

  const generateMeal = async () => {
    const confirmResult = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to generate the meal for the selected date?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, generate it!",
      cancelButtonText: "No, cancel",
      reverseButtons: true,
    });

    if (confirmResult.isConfirmed) {
      Swal.fire({
        title: "Generating meal...",
        text: "Please wait while we generate the meal.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const result = await Axios.post("/meal/generate-meal", {
          date: formatDate(fromDate),
          wing: gender, // Pass wing as gender
        });
        Swal.fire({
          icon: "success",
          title: "Meal generated successfully",
          text: result.data.message,
        });
        setRefetch(!refetch);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Failed to generate meal",
          text: "An error occurred while generating meal.",
        });
        console.error("Error generating meal:", error);
      }
    } else {
      Swal.fire({
        title: "Cancelled",
        text: "Meal generation was cancelled.",
        icon: "info",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <MealControls
        fromDate={fromDate}
        setFromDate={setFromDate}
        generateMeal={generateMeal}
        exportToExcel={exportToExcel}
      />

      <MealStats
        gender={gender}
        setGender={setGender}
        residence={residence}
        setResidence={setResidence}
        search={search}
        setSearch={setSearch}
        breakfastCount={breakfastCount}
        lunchCount={lunchCount}
        dinnerCount={dinnerCount}
      />

      <MealTable
        students={filteredStudents}
        setStudents={setStudents}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortAsc={sortAsc}
        setSortAsc={setSortAsc}
        breakfastFeast={breakfastFeast}
        lunchFeast={lunchFeast}
        dinnerFeast={dinnerFeast}
        breakfastLock={breakfastLock}
        lunchLock={lunchLock}
        dinnerLock={dinnerLock}
        handleMealLock={handleMealLock}
        date={fromDate}
      />
    </div>
  );
};

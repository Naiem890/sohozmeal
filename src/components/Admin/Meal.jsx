import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { fixedInputClass } from "../../Utils/constant";
import { Axios } from "../../api/api";
import ReactDatePicker from "react-datepicker";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import * as XLSX from "xlsx"; // Import xlsx for Excel file generation

const RESIDENCES = ["OSMANY_HALL", "EXT_A", "EXT_B", "EXT_C", "EXT_D"];

export const Meal = () => {
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
    adjustedDate.setHours(0, 0, 0, 0); // Set the time to midnight (local time)

    const year = adjustedDate.getFullYear();
    const month = String(adjustedDate.getMonth() + 1).padStart(2, "0");
    const day = String(adjustedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Fetch the lock status for breakfast, lunch, and dinner on first load
  useEffect(() => {
    const fetchMealLockStatus = async () => {
      const formattedDate = formatDate(fromDate);
      try {
        // Check for breakfast feast
        const breakfastStatus = await Axios.post("/feast/check", {
          date: formattedDate,
          meal: "breakfast",
          wing: gender,
        });
        setBreakfastFeast(breakfastStatus.data.status === "on");
        setBreakfastLock(breakfastStatus.data.status === "on");

        // Check for lunch feast
        const lunchStatus = await Axios.post("/feast/check", {
          date: formattedDate,
          meal: "lunch",
          wing: gender,
        });
        setLunchFeast(lunchStatus.data.status === "on");
        setLunchLock(lunchStatus.data.status === "on");

        // Check for dinner feast
        const dinnerStatus = await Axios.post("/feast/check", {
          date: formattedDate,
          meal: "dinner",
          wing: gender,
        });
        setDinnerFeast(dinnerStatus.data.status === "on");
        setDinnerLock(dinnerStatus.data.status === "on");
      } catch (error) {
        toast.error("Failed to fetch meal lock status");
        console.error("Error fetching meal lock status:", error);
      }
    };

    fetchMealLockStatus(); // Call the function to check lock status on load
  }, [fromDate, gender]);

  useEffect(() => {
    fetchStudents();
    async function fetchStudents() {
      const formattedDate = formatDate(fromDate);
      const result = await Axios.get("/meal/students", {
        params: { date: formattedDate, gender: gender },
      });
      setStudents(result.data);
    }
  }, [refetch, fromDate, gender]);

  // Calculate the number of meals on for breakfast, lunch, and dinner
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

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(true);
    }
  };

  useEffect(() => {
    const filterSearch = (student) => {
      if (search === "") {
        return student;
      } else if (
        student.studentId.toLowerCase().includes(search.toLowerCase()) ||
        student.hallId.toLowerCase().includes(search.toLowerCase()) ||
        student.name.toLowerCase().includes(search.toLowerCase())
      ) {
        return student;
      }
    };

    const filterGender = (student) => {
      if (gender === "") {
        return student;
      } else if (student.gender === gender) {
        return student;
      }
    };

    const filterResidence = (student) => {
      if (residence === "") {
        return student;
      } else if (student.residence === residence) {
        return student;
      }
    };

    const filteredResult = students
      .filter(filterSearch)
      .filter(filterGender)
      .filter(filterResidence);

    if (sortBy) {
      filteredResult.sort((a, b) => {
        if (sortBy === "residence") {
          if (a.residence < b.residence) {
            return sortAsc ? -1 : 1;
          }
          if (a.residence > b.residence) {
            return sortAsc ? 1 : -1;
          }
          return 0;
        } else {
          if (a[sortBy] < b[sortBy]) {
            return sortAsc ? -1 : 1;
          }
          if (a[sortBy] > b[sortBy]) {
            return sortAsc ? 1 : -1;
          }
          return 0;
        }
      });
    }

    setFilteredStudents(filteredResult);
  }, [sortBy, sortAsc, search, students, gender, residence]);

  const handleMealToggle = (studentId, mealType) => {
    toast.success(`Meal ${mealType} toggled for student ${studentId}`);
  };

  const handleMealLock = async (mealType) => {
    const formattedDate = formatDate(fromDate); // Format the selected date

    try {
      // Step 1: Check if the hall feast is on or off
      const checkResult = await Axios.post("/feast/check", {
        date: formattedDate,
        meal: mealType,
      });
      const isFeastOn = checkResult.data.status === "on";

      // Step 2: If the feast is on, turn it off by deleting it
      if (isFeastOn) {
        await Axios.delete(`/feast/date/${formattedDate}/meal/${mealType}`);
        toast.success(
          `Hall feast for ${mealType} on ${formattedDate} turned off!`
        );

        // Update the lock state and feast status
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
      }
      // Step 3: If the feast is off, turn it on by creating it
      else {
        await Axios.post("/feast", {
          date: formattedDate,
          meal: mealType,
          wing: gender, // You can pass the relevant wing information here if needed
        });
        toast.success(
          `Hall feast for ${mealType} on ${formattedDate} turned on!`
        );

        // Update the lock state and feast status
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

  const generateMeal = async () => {
    try {
      const result = await Axios.post("/meal/generate-meal", {
        date: formatDate(fromDate),
      });
      toast.success(result.data.message);
      setRefetch(!refetch);
    } catch (error) {
      toast.error("An error occurred while generating meal");
      console.error("Error generating meal:", error);
    }
  };

  return (
    <div className="px-5 lg:mr-12 max-h-screen overflow-hidden">
      <div className="flex justify-between items-center mt-2">
        <h2 className="mt-2 text-2xl font-semibold">Meal Sheet</h2>
        <div className="flex">
          <h3
            className="text-md font-bold bg-emerald-500 px-4 py-2 text-white rounded-lg hover:bg-emerald-600 cursor-pointer transition-all duration-300 hover:ring-1 ring-offset-2 ring-emerald-500"
            onClick={generateMeal}
          >
            Generate Meal
          </h3>
          <ReactDatePicker
            selected={fromDate}
            onChange={(date) => {
              setFromDate(date);
            }}
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
      <div className="divider m-0"></div>
      <div className="flex justify-between items-center gap-12 my-2">
        <div className="flex gap-2">
          <h3 className="text-md font-bold bg-gray-100 px-4 py-2 text-gray-400 rounded-lg">
            B: {breakfastCount}
          </h3>
          <h3 className="text-md font-bold bg-gray-100 px-4 py-2 text-gray-400 rounded-lg">
            L: {lunchCount}
          </h3>
          <h3 className="text-md font-bold bg-gray-100 px-4 py-2 text-gray-400 rounded-lg">
            D: {dinnerCount}
          </h3>
        </div>
        <div className="flex gap-2 basis-2/3">
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={`${fixedInputClass} h-auto basis-1/4`}
          >
            <option value="">Gender</option>
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
          </select>
          <select
            value={residence}
            onChange={(e) => setResidence(e.target.value)}
            className={`${fixedInputClass} h-auto basis-1/4`}
          >
            <option value="">All Residence</option>
            {RESIDENCES.map((res) => (
              <option key={res} value={res}>
                {res}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Name, Roll, Hall ID"
            className={`${fixedInputClass} h-auto basis-2/4`}
          />
        </div>
      </div>
      <div className="overflow-x-auto max-h-screen overflow-y-scroll px-1 pb-32">
        <table className="table table-sm table-hover w-full">
          <thead className="bg-white shadow-sm sticky top-0 border-0 h-12">
            <tr className="">
              <th onClick={() => toggleSort("hallId")} className="uppercase">
                Hall Id {sortBy === "hallId" && (sortAsc ? "↑" : "↓")}
              </th>
              <th onClick={() => toggleSort("studentId")} className="uppercase">
                Student Id {sortBy === "studentId" && (sortAsc ? "↑" : "↓")}
              </th>
              <th onClick={() => toggleSort("name")} className="uppercase">
                Name {sortBy === "name" && (sortAsc ? "↑" : "↓")}
              </th>
              <th onClick={() => toggleSort("roomNo")} className="uppercase">
                Room No {sortBy === "roomNo" && (sortAsc ? "↑" : "↓")}
              </th>
              <th onClick={() => toggleSort("residence")} className="uppercase">
                Residence {sortBy === "residence" && (sortAsc ? "↑" : "↓")}
              </th>
              <th className="flex flex-col gap-1 justify-center items-center uppercase text-center">
                <h3>Meal</h3>
                <div className="flex flex-row w-full justify-evenly">
                  <h3
                    className={`text-sm font-bold ${
                      breakfastFeast
                        ? "bg-green-400 text-white"
                        : breakfastLock
                        ? "bg-red-500 text-white"
                        : "bg-gray-100"
                    }  px-2 py-1 text-gray-400 rounded-lg cursor-pointer transition-all duration-300 ml-2`}
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
                    }  px-2 py-1 text-gray-400 rounded-lg cursor-pointer transition-all duration-300`}
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
                    }  px-2 py-1 text-gray-400 rounded-lg cursor-pointer transition-all duration-300 mr-2`}
                    onClick={() => handleMealLock("dinner")}
                  >
                    D
                  </h3>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="">
            {filteredStudents.map((student) => (
              <tr
                className="hover:shadow-sm rounded-lg hover:bg-emerald-50 transition-all border-b-0"
                key={student._id}
              >
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useEffect, useState, useRef } from "react";
import { Axios } from "../../api/api";
import { format, isToday } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { fixedButtonClass, fixedInputClass } from "../../Utils/constant";

const MealRoutine = () => {
  const [mealData, setMealData] = useState([]);
  const [selectedWing, setSelectedWing] = useState("MALE");
  const currentDay = format(new Date(), "EEEE").toUpperCase();
  const mealRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => mealRef.current,
    documentTitle: "Meal Routine",
  });

  const dayNameMap = {
    SUNDAY: "রবিবার",
    MONDAY: "সোমবার",
    TUESDAY: "মঙ্গলবার",
    WEDNESDAY: "বুধবার",
    THURSDAY: "বৃহস্পতিবার",
    FRIDAY: "শুক্রবার",
    SATURDAY: "শনিবার",
  };

  const fetchMealRoutineData = async (wing) => {
    try {
      const response = await Axios.get("/meal/routine", {
        params: { wing }, // Pass the selected wing as a query parameter
      });
      setMealData(response.data);
    } catch (error) {
      console.error("Error fetching meal routine data:", error);
    }
  };

  useEffect(() => {
    fetchMealRoutineData(selectedWing); // Fetch data when wing changes
  }, [selectedWing]);

  const handleWingChange = (e) => {
    setSelectedWing(e.target.value); // Update selected wing
  };

  return (
    <>
      <div className="lg:mt-10 mb-4 px-5 lg:mr-12">
        {/* Header with Dropdown */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-semibold">Meal Routine</h2>
          <div className="flex items-center">
            <select
              value={selectedWing}
              onChange={handleWingChange}
              className={`${fixedInputClass} h-auto cursor-pointer w-44 font-extralight text-sm`}
            >
              <option value="">Gender</option>
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
            </select>
          </div>
        </div>

        <div ref={mealRef} className="container flex justify-start max-w-7xl">
          <div className="relative shadow-md w-full">
            <table className="w-full table-auto text-sm text-left text-black border-collapse">
              <thead className="text-xs uppercase shadow-[0_8px_30px_rgb(0,0,0,0.30) text-black w-full">
                <tr className="font-notoSerifBangla font-extrabold text-base">
                  {/* First column with smaller width */}
                  <th className="w-1/6 text-center border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3">
                    দিন
                  </th>
                  {/* Remaining columns with equal width */}
                  <th className="w-1/3 text-center border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3">
                    সকাল
                  </th>
                  <th className="w-1/3 text-center border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3">
                    দুপুর
                  </th>
                  <th className="w-1/3 text-center border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3">
                    রাত
                  </th>
                </tr>
              </thead>
              <tbody>
                {mealData.map((routine) => (
                  <tr
                    key={routine._id}
                    className={`bg-gray-50 font-notoSerifBangla md:text-lg ${
                      isToday(new Date()) && routine.day === currentDay
                        ? "font-extrabold bg-emerald-400 md:text-lg"
                        : ""
                    }`}
                  >
                    <td className="w-1/6 text-center border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3">
                      {dayNameMap[routine.day] || routine.day}
                    </td>
                    <td className="w-1/3 text-center border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3">
                      {routine.breakfast}
                    </td>
                    <td className="w-1/3 text-center border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3">
                      {routine.lunch}
                    </td>
                    <td className="w-1/3 text-center border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3">
                      {routine.dinner}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="lg:my-5 mb-10 px-5 lg:mr-12">
        <button onClick={handlePrint} className={`${fixedButtonClass} sm:w-40`}>
          Export PDF
        </button>
      </div>
    </>
  );
};

export default MealRoutine;

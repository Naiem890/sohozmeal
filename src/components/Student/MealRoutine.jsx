import React, { useEffect, useState, useRef } from "react";
import { Axios } from "../../api/api";
import { format, isToday } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { fixedButtonClass } from "../../Utils/constant";
const MealRoutine = () => {
  const [mealData, setMealData] = useState([]);
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

  const fetchMealRoutineData = async () => {
    try {
      const response = await Axios.get("/meal/routine");
      setMealData(response.data);
    } catch (error) {
      console.error("Error fetching meal routine data:", error);
    }
  };

  useEffect(() => {
    fetchMealRoutineData();
  }, []);

  return (
    <>
      <div className=" lg:mt-10 mb-4 px-5 lg:mr-12">
        <h2 className="text-3xl font-semibold">Meal Routine</h2>
        <div className="divider"></div>
        <div ref={mealRef} className="container flex justify-start max-w-7xl">
          <div className="relative shadow-md w-full">
            <table className="text-sm text-left text-black w-full">
              <thead className="text-xs uppercase shadow-[0_8px_30px_rgb(0,0,0,0.30) text-black w-full">
                <tr className="font-notoSerifBangla font-extrabold text-base">
                  <th
                    className={`text-center text-black table-auto border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3`}
                  >
                    দিন
                  </th>
                  <th
                    scope="col"
                    className={`text-black text-center border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3 $`}
                  >
                    সকাল
                  </th>
                  <th
                    scope="col"
                    className={`text-black text-center px-2 border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3 `}
                  >
                    দুপুর
                  </th>
                  <th
                    scope="col"
                    className={`text-center text-black border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3`}
                  >
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
                    <th
                      className={` text-center border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3 ${
                        isToday(new Date()) && routine.day === currentDay
                          ? "font-extrabold  md:text-lg"
                          : ""
                      }`}
                    >
                      <p
                        className={`${
                          isToday(new Date()) && routine.day === currentDay
                            ? "font-extrabold md:text-lg bg-emerald-700 rounded-full text-white"
                            : ""
                        }`}
                      >
                        {dayNameMap[routine.day] || routine.day}
                      </p>
                    </th>
                    <td
                      scope=""
                      className={`p-0 text-center border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3`}
                    >
                      {routine.breakfast}
                    </td>
                    <td
                      className={`text-center border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3 `}
                    >
                      {routine.lunch}
                    </td>
                    <td
                      className={`text-center border-2 border-emerald-700 md:text-lg md:px-4 sm:px-2 sm:py-3`}
                    >
                      {routine.dinner}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="lg:my-5 mb-10 px-5 lg:mr-12">
        <button onClick={handlePrint} className={`${fixedButtonClass} sm:w-40`}>
          Export PDF
        </button>
      </div>
    </>
  );
};

export default MealRoutine;

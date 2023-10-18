import React, { useEffect, useState } from "react";
import { Axios } from "../../api/api";
import { format, isToday } from "date-fns";

const MealRoutine = () => {
  const [mealData, setMealData] = useState([]);
  const currentDay = format(new Date(), "EEEE");
  const dayNameMap = {
    Sunday: "রবিবার",
    Monday: "সোমবার",
    Tuesday: "মঙ্গলবার",
    Wednesday: "বুধবার",
    Thursday: "বৃহস্পতিবার",
    Friday: "শুক্রবার",
    Saturday: "শনিবার",
  };
  const fetchMealRoutineData = async () => {
    try {
      const response = await Axios.get("/meal/routine");
      const daysOfWeekOrder = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const sortedData = response.data.sort((a, b) => {
        const dayA = daysOfWeekOrder.indexOf(a.day);
        const dayB = daysOfWeekOrder.indexOf(b.day);
        return dayA - dayB;
      });

      setMealData(sortedData);
    } catch (error) {
      console.error("Error fetching meal routine data:", error);
    }
  };

  useEffect(() => {
    fetchMealRoutineData();
  }, []);

  return (
    <div className="lg:my-10 mb-10 px-5 lg:mr-12">
      <h2 className="text-3xl font-semibold">Meal Routine</h2>
      <div className="divider"></div>
      <div className="container flex justify-start min-w-full">
        <div className="relative shadow-md min-w-full">
          <table className="text-sm text-left text-black min-w-full">
            <thead className="text-xs uppercase shadow-[0_8px_30px_rgb(0,0,0,0.30)  text-black">
              <tr className=" font-notoSerifBangla font-extrabold text-base">
                <th className="py-3 p-2 text-center text-black table-auto border-2 border-slate-950 md:text-lg">
                  দিন
                </th>
                <th
                  scope="col"
                  className="text-black px-2 py-3 text-center border-2 border-slate-950 md:text-lg"
                >
                  সকাল
                </th>
                <th
                  scope="col"
                  className=" py-3 text-black text-center px-2 border-2 border-slate-950 md:text-lg"
                >
                  দুপুর
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 text-center text-black border-2 border-slate-950 md:text-lg"
                >
                  রাত
                </th>
              </tr>
            </thead>
            <tbody>
              {mealData.map((routine) => (
                <tr
                  key={routine._id}
                  className={`bg-gray-50 font-notoSerifBangla hover:bg-yellow-200 md:text-lg ${
                    isToday(new Date()) && routine.day === currentDay
                      ? "font-extrabold bg-emerald-400 hover:bg-emerald-400 md:text-lg"
                      : ""
                  }`}
                >
                  <th
                    className={`py-3  text-center border-2 border-slate-950 p-2 md:text-lg ${
                      isToday(new Date()) && routine.day === currentDay
                        ? "font-extrabold bg-emerald-400 md:text-lg"
                        : ""
                    }`}
                  >
                    {dayNameMap[routine.day] || routine.day}
                  </th>
                  <td
                    scope=""
                    className="py-4 border-2 border-slate-950 text-center md:text-lg"
                  >
                    {routine.breakfast}
                  </td>
                  <td className="py-4 border-2 border-slate-950 text-center md:text-lg">
                    {routine.lunch}
                  </td>
                  <td className="py-4 border-2 border-slate-950 text-center md:text-lg">
                    {routine.dinner}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default MealRoutine;

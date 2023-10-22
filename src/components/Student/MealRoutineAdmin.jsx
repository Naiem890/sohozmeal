import React, { useEffect, useState, useRef } from "react";
import { Axios } from "../../api/api";
import { format, isToday, set } from "date-fns";
import { fixedButtonClass, fixedInputClass } from "../../Utils/constant";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
import Swal from "sweetalert2";

const MealRoutineAdmin = () => {
  const [mealData, setMealData] = useState([]);
  const currentDay = format(new Date(), "EEEE").toUpperCase();
  const mealRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => mealRef.current,
    documentTitle: "Meal Routine",
    onAfterPrint: () => {
      toast.success("Meal routine printed successfully!");
    },
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

  const getRandomColor = () => {
    const colors = ["bg-gray-200", "bg-white", "bg-white", "bg-white"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleInputChange = (e, index, mealType) => {
    const newValue = e.target.value;
    setMealData((prevData) => {
      const newData = [...prevData];
      newData[index][mealType] = newValue;
      return newData;
    });
    console.log(mealData);
  };

  // const handleSubmit = async () => {
  //   try {
  //     const { data: response } = await Axios.put("/meal/routine", mealData);
  //     console.log(response);
  //     toast.success(response.message);
  //     setMealData(response.routines);
  //   } catch (error) {
  //     toast.error(error.response.data.message);
  //     console.error("Error updating meal routine data:", error);
  //   }
  // };

  const handleSubmit = async () => {
    const result = await Swal.fire({
      title: "Do you want to save the changes?",
      showDenyButton: true,
      confirmButtonText: "Save",
      denyButtonText: `Don't save`,
    });

    if (result.isConfirmed) {
      try {
        const { data: response } = await Axios.put("/meal/routine", mealData);
        console.log(response);
        toast.success(response.message);
        setMealData(response.routines);
      } catch (error) {
        toast.error(error.response.data.message);
        console.error("Error updating meal routine data:", error);
      }
    }
  };

  return (
    <div className="lg:my-10 mb-10 px-5 lg:mr-12">
      <h2 className="text-3xl font-semibold">Meal Routine</h2>
      <div className="divider"></div>
      <div ref={mealRef} className="container flex justify-start max-w-7xl">
        <div className="relative shadow-md w-full">
          <table className="text-sm text-left text-black w-full">
            <thead className="text-xs uppercase shadow-[0_8px_30px_rgb(0,0,0,0.30) text-black w-full">
              <tr className="font-notoSerifBangla font-extrabold text-base">
                <th
                  className={`text-center text-black table-auto border-2 border-slate-950 md:text-lg md:px-4 sm:px-2 sm:py-3`}
                >
                  দিন
                </th>
                <th
                  scope="col"
                  className={`text-black text-center border-2 border-slate-950 md:text-lg md:px-4 sm:px-2 sm:py-3 $`}
                >
                  সকাল
                </th>
                <th
                  scope="col"
                  className={`text-black text-center px-2 border-2 border-slate-950 md:text-lg md:px-4 sm:px-2 sm:py-3 `}
                >
                  দুপুর
                </th>
                <th
                  scope="col"
                  className={`text-center text-black border-2 border-slate-950 md:text-lg md:px-4 sm:px-2 sm:py-3`}
                >
                  রাত
                </th>
              </tr>
            </thead>
            <tbody>
              {mealData.map((routine, index) => (
                <tr
                  key={routine._id}
                  className={`bg-gray-50 font-notoSerifBangla md:text-lg ${
                    isToday(new Date()) && routine.day === currentDay
                      ? "font-extrabold bg-emerald-400 md:text-lg"
                      : ""
                  }`}
                >
                  <th
                    className={` text-center border-2 border-slate-950 md:text-lg md:px-4 sm:px-2 sm:py-3 ${
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
                    className={`text-center border-2 border-slate-950 md:text-lg ${getRandomColor()} h-1 p-0`}
                  >
                    <input
                      type="text"
                      value={mealData[index].breakfast}
                      onChange={(e) => handleInputChange(e, index, "breakfast")}
                      className={`${fixedInputClass} h-full rounded-none focus:bg-emerald-50 md:px-4 sm:px-2 sm:py-3`}
                    />
                    {/* md:px-4 sm:px-2 sm:py-3 */}
                  </td>
                  <td
                    className={`text-center p-0 border-2 border-slate-950 md:text-lg ${getRandomColor()} h-1 p-0`}
                  >
                    <input
                      type="text"
                      value={mealData[index].lunch}
                      onChange={(e) => handleInputChange(e, index, "lunch")}
                      className={`${fixedInputClass} h-full rounded-none focus:bg-emerald-50 md:px-4 sm:px-2 sm:py-3`}
                    />
                  </td>
                  <td
                    className={`text-center border-2 border-slate-950 md:text-lg  ${getRandomColor()}  h-1 p-0`}
                  >
                    <input
                      type="text"
                      value={mealData[index].dinner}
                      onChange={(e) => handleInputChange(e, index, "dinner")}
                      className={`${fixedInputClass} h-full rounded-none focus:bg-emerald-50 md:px-4 sm:px-2 sm:py-3`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={handleSubmit}
          className={`${fixedButtonClass} sm:w-44`}
        >
          Update Changes
        </button>
        <button onClick={handlePrint} className={`${fixedButtonClass} sm:w-44`}>
          Export PDF
        </button>
      </div>
    </div>
  );
};

export default MealRoutineAdmin;

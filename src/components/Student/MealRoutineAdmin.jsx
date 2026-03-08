import React, { useEffect, useState, useRef } from "react";
import { Axios } from "../../api/api";
import { format, isToday } from "date-fns";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fixedInputClass = "w-full rounded-lg h-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6";
const fixedButtonClass = "w-full rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-colors";
import { useReactToPrint } from "react-to-print";
import { useConfirm } from "../Common/ConfirmDialog";
import * as XLSX from "xlsx"; // Import xlsx for Excel file generation
import { useAuthUser } from "react-auth-kit";

const MealRoutineAdmin = () => {
  const auth = useAuthUser()();
  const confirm = useConfirm();
  const [mealData, setMealData] = useState([]);
  const [selectedWing, setSelectedWing] = useState(
    auth.wing === "ALL" ? "MALE" : auth.wing
  ); // Default to MALE wing
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

  const dayOrder = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  // Generate a default routine with empty values if no data is available
  const defaultRoutine = () => {
    return dayOrder.map((day) => ({
      day: day,
      breakfast: "",
      lunch: "",
      dinner: "",
    }));
  };

  // Sort meal data according to the day order
  const sortMealData = (data) => {
    return data.sort(
      (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
    );
  };

  const fetchMealRoutineData = async (wing) => {
    try {
      const response = await Axios.get("/meal/routine", { params: { wing } });
      const data =
        response.data.length && response.data.some((item) => item !== null)
          ? sortMealData(response.data) // Sort the data before setting state
          : defaultRoutine(); // Fallback to default routine if all values are null
      setMealData(data);
    } catch (error) {
      console.error("Error fetching meal routine data:", error);
      setMealData(defaultRoutine()); // Set default routine on error
    }
  };

  useEffect(() => {
    fetchMealRoutineData(selectedWing); // Fetch data based on selected wing
  }, [selectedWing]);

  const handleInputChange = (e, index, mealType) => {
    const newValue = e.target.value;
    setMealData((prevData) => {
      const newData = [...prevData];
      newData[index][mealType] = newValue;
      return newData;
    });
  };

  const handleSubmit = async () => {
    const ok = await confirm({
      title: "Save changes?",
      description: "Do you want to save the meal routine changes?",
      confirmText: "Save",
      cancelText: "Don't save",
    });

    if (ok) {
      try {
        // Include the selectedWing in the query parameters
        const { data: response } = await Axios.put(
          `/meal/routine?wing=${selectedWing}`,
          mealData
        );
        toast.success(response.message);
        setMealData(sortMealData(response.routines)); // Sort the data before setting state
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Error updating meal routine."
        );
        console.error("Error updating meal routine data:", error);
      }
    }
  };

  const handleWingChange = (value) => {
    setSelectedWing(value);
  };

  // Export meal data to Excel
  const exportToExcel = () => {
    // Prepare data for Excel export with Bangla headers
    const formattedData = mealData.map((routine) => ({
      দিন: dayNameMap[routine.day] || routine.day, // Day in Bangla
      সকাল: routine.breakfast, // Breakfast in Bangla
      দুপুর: routine.lunch, // Lunch in Bangla
      রাত: routine.dinner, // Dinner in Bangla
    }));

    // Create a new worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Meal Routine");

    // Define the file name
    const fileName = `${selectedWing}_Meal_Routine.xlsx`;

    // Write the Excel file
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Meal Routine</h2>
        {/* Wing Selection Dropdown */}
        {auth.wing === "ALL" && (
          <Select value={selectedWing} onValueChange={handleWingChange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Wing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div ref={mealRef} className="container flex justify-start max-w-7xl">
        <div className="relative shadow-md w-full">
          <table className="text-sm text-left text-black w-full">
            <thead className="text-xs uppercase shadow-[0_8px_30px_rgb(0,0,0,0.30) text-black w-full">
              <tr className="font-notoSerifBangla font-extrabold text-base">
                <th className="text-center text-black table-auto border-2 border-slate-950 md:text-lg md:px-4 sm:px-2 sm:py-3">
                  দিন
                </th>
                <th className="text-black text-center border-2 border-slate-950 md:text-lg md:px-4 sm:px-2 sm:py-3">
                  সকাল
                </th>
                <th className="text-black text-center border-2 border-slate-950 md:text-lg md:px-4 sm:px-2 sm:py-3">
                  দুপুর
                </th>
                <th className="text-black text-center border-2 border-slate-950 md:text-lg md:px-4 sm:px-2 sm:py-3">
                  রাত
                </th>
              </tr>
            </thead>
            <tbody>
              {mealData.map((routine, index) => (
                <tr
                  key={routine?.day || index}
                  className={`bg-gray-50 font-notoSerifBangla md:text-lg ${
                    isToday(new Date()) && routine?.day === currentDay
                      ? "font-extrabold bg-emerald-400 md:text-lg"
                      : ""
                  }`}
                >
                  <th
                    className={`text-center border-2 border-slate-950 md:text-lg md:px-4 sm:px-2 sm:py-3`}
                  >
                    <p
                      className={`${
                        isToday(new Date()) && routine?.day === currentDay
                          ? "font-extrabold md:text-lg bg-emerald-700 rounded-full text-white"
                          : ""
                      }`}
                    >
                      {dayNameMap[routine?.day] || routine?.day}
                    </p>
                  </th>
                  <td className="text-center border-2 border-slate-950 md:text-lg h-1 p-0">
                    <input
                      type="text"
                      value={mealData[index]?.breakfast || ""} // Fallback to empty string if null or undefined
                      onChange={(e) => handleInputChange(e, index, "breakfast")}
                      className={`${fixedInputClass} h-full rounded-none focus:bg-emerald-50 md:px-4 sm:px-2 sm:py-3`}
                    />
                  </td>
                  <td className="text-center p-0 border-2 border-slate-950 md:text-lg h-1">
                    <input
                      type="text"
                      value={mealData[index]?.lunch || ""} // Fallback to empty string if null or undefined
                      onChange={(e) => handleInputChange(e, index, "lunch")}
                      className={`${fixedInputClass} h-full rounded-none focus:bg-emerald-50 md:px-4 sm:px-2 sm:py-3`}
                    />
                  </td>
                  <td className="text-center border-2 border-slate-950 md:text-lg h-1 p-0">
                    <input
                      type="text"
                      value={mealData[index]?.dinner || ""} // Fallback to empty string if null or undefined
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
        <button
          onClick={exportToExcel}
          className={`${fixedButtonClass} sm:w-44`}
        >
          Export Excel
        </button>
      </div>
    </div>
  );
};

export default MealRoutineAdmin;

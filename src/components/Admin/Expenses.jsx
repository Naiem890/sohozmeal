import React, { useCallback, useEffect, useState } from "react";
import formatDate from "../../Utils/formatDateString";
import { Axios } from "../../api/api";
import DatePickerComponent from "../Common/DatePickerComponent";

export default function Expenses() {
  const [distinctMonths, setDistinctMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [mealBillData, setMealBillData] = useState([]);
  const [wing, setWing] = useState("MALE"); // Add wing state

  useEffect(() => {
    const fetchDistinctMonths = async () => {
      const res = await Axios.get("/meal/months");
      setDistinctMonths(res.data);
      setSelectedMonth(res.data.slice(-1)[0]);
    };

    fetchDistinctMonths();
  }, []);

  useEffect(() => {
    const fetchBill = async () => {
      if (selectedMonth) {
        const [year, month] = selectedMonth.split("-");
        try {
          const res = await Axios.get(
            `/cost/student?year=${year}&month=${month}&wing=${wing}` // Pass the selected wing
          );
          setMealBillData(res.data.mealBillData);
        } catch (err) {
          console.log("Error fetching bill data:", err);
        }
      }
    };
    fetchBill();
  }, [selectedMonth, wing]); // Trigger the effect when wing changes

  const handleDateChange = useCallback((date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    setSelectedMonth(`${year}-${month}`);
  }, []);

  const handleWingChange = (e) => {
    setWing(e.target.value); // Update wing when user selects a different option
  };

  const getDaysInMonth = useCallback((year, month) => {
    const date = new Date(year, month, 0);
    const days = [];
    for (let i = 1; i <= date.getDate(); i++) {
      days.push(
        `${year}-${month.toString().padStart(2, "0")}-${i
          .toString()
          .padStart(2, "0")}`
      );
    }
    return days;
  }, []);

  const [year, month] = selectedMonth.split("-");
  const daysOfMonth = getDaysInMonth(year, month);

  return (
    <div className="mt-2">
      <div className="flex justify-between gap-2 h-auto">
        <h2 className="text-lg self-center xs:text-3xl font-semibold">
          Mess Bill
        </h2>

        {/* Add wing selection dropdown */}

        <div className=" flex gap-2">
          <div className="">
            <select
              value={wing}
              onChange={handleWingChange}
              className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500 transition-all duration-300 ease-in-out w-44"
            >
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
            </select>
          </div>
          <DatePickerComponent
            selectedDate={new Date(selectedMonth + "-01")}
            onDateChange={handleDateChange}
          />
        </div>
      </div>
      <div className="my-4">
        <div className="">
          <table className="table table-xs border-collapse border border-slate-500 table-hover h-full text-center">
            <thead className="bg-gray-200 border border-slate-500 z-10">
              <tr className="border">
                <th rowSpan={2} className="p-0 border border-slate-500">
                  Date
                </th>
                <th className="p-0 border border-slate-500" colSpan={3}>
                  Breakfast
                </th>
                <th className="p-0 border border-slate-500" colSpan={3}>
                  Lunch
                </th>
                <th className="p-0 border border-slate-500" colSpan={3}>
                  Dinner
                </th>
                <th className="p-0 border border-slate-500" colSpan={2}>
                  Total
                </th>
              </tr>
              <tr className="border">
                <th className="border border-slate-500">Total Cost</th>
                <th className="border border-slate-500">Total Students</th>
                <th className="border border-slate-500">Per Head</th>
                <th className="border border-slate-500">Total Cost</th>
                <th className="border border-slate-500">Total Students</th>
                <th className="border border-slate-500">Per Head</th>
                <th className="border border-slate-500">Total Cost</th>
                <th className="border border-slate-500">Total Students</th>
                <th className="border border-slate-500">Per Head</th>
                <th className="border border-slate-500">Total Cost</th>
                <th className="border border-slate-500">Per Head</th>
              </tr>
            </thead>
            <tbody>
              {daysOfMonth.map((day) => {
                const item = mealBillData.find((data) => data.date === day);
                return (
                  <React.Fragment key={day}>
                    <tr className="hover:bg-gray-100 border border-slate-500 text-center">
                      <td className="px-1 border border-slate-500">
                        {new Date(day).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      {/* for breakfast */}
                      <td className="p-0 border border-slate-500">
                        <span>
                          {" "}
                          {item?.mealBill?.breakfast?.totalCost?.toFixed(2) ||
                            "0"}{" "}
                          ৳
                        </span>
                      </td>
                      <td className="p-0 border border-slate-500">
                        <span>
                          {item?.mealBill?.breakfast?.totalStudent || "0"}
                        </span>
                      </td>
                      <td className="p-0 border border-slate-500">
                        <span>
                          {item?.mealBill?.breakfast?.perHeadCost?.toFixed(2) ||
                            "0"}{" "}
                          ৳
                        </span>
                      </td>
                      {/* for lunch */}
                      <td className="p-0 border border-slate-500">
                        <span>
                          {" "}
                          {item?.mealBill?.lunch?.totalCost?.toFixed(2) ||
                            "0"}{" "}
                          ৳
                        </span>
                      </td>
                      <td className="p-0 border border-slate-500">
                        <span>
                          {item?.mealBill?.lunch?.totalStudent || "0"}
                        </span>
                      </td>
                      <td className="p-0 border border-slate-500">
                        <span>
                          {item?.mealBill?.lunch?.perHeadCost?.toFixed(2) ||
                            "0"}{" "}
                          ৳
                        </span>
                      </td>
                      {/* for dinner */}
                      <td className="p-0 border border-slate-500">
                        <span>
                          {" "}
                          {item?.mealBill?.dinner?.totalCost?.toFixed(2) ||
                            "0"}{" "}
                          ৳
                        </span>
                      </td>
                      <td className="p-0 border border-slate-500">
                        <span>
                          {item?.mealBill?.dinner?.totalStudent || "0"}
                        </span>
                      </td>
                      <td className="p-0 border border-slate-500">
                        <span>
                          {item?.mealBill?.dinner?.perHeadCost?.toFixed(2) ||
                            "0"}{" "}
                          ৳
                        </span>
                      </td>
                      {/* Total */}
                      <td className="p-0 border border-slate-500">
                        <span>
                          {(
                            (item?.mealBill?.breakfast?.totalCost || 0) +
                            (item?.mealBill?.lunch?.totalCost || 0) +
                            (item?.mealBill?.dinner?.totalCost || 0)
                          ).toFixed(2)}{" "}
                          ৳
                        </span>
                      </td>
                      <td className="p-0 border border-slate-500">
                        <span>
                          {(
                            (item?.mealBill?.breakfast?.perHeadCost || 0) +
                            (item?.mealBill?.lunch?.perHeadCost || 0) +
                            (item?.mealBill?.dinner?.perHeadCost || 0)
                          ).toFixed(2)}{" "}
                          ৳
                        </span>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
              {
                <tr className="border-t">
                  <td colSpan="11" className="text-right font-bold text-xl p-0">
                    Grand Total
                  </td>
                  <td className="p-0 font-bold text-xl">
                    {mealBillData
                      .reduce(
                        (total, item) =>
                          total +
                          (item.mealBill.breakfast.totalCost || 0) +
                          (item.mealBill.lunch.totalCost || 0) +
                          (item.mealBill.dinner.totalCost || 0),
                        0
                      )
                      .toFixed(2)}{" "}
                    ৳
                    <br />
                    {mealBillData
                      .reduce(
                        (total, item) =>
                          total +
                          (item.mealBill.breakfast.perHeadCost || 0) +
                          (item.mealBill.lunch.perHeadCost || 0) +
                          (item.mealBill.dinner.perHeadCost || 0),
                        0
                      )
                      .toFixed(2)}{" "}
                    ৳
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

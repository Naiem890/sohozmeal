import React, { useCallback, useEffect, useState } from "react";
import formatDate from "../../Utils/formatDateString";
import { Axios } from "../../api/api";
import DatePickerComponent from "../Common/DatePickerComponent";

export default function Expenses() {
  const [distinctMonths, setDistinctMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [mealBillData, setMealBillData] = useState([]);

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
            `/bill/student?year=${year}&month=${month}`
          );
          setMealBillData(res.data.mealBillData);
        } catch (err) {
          console.log("Error fetching bill data:", err);
        }
      }
    };
    fetchBill();
  }, [selectedMonth]);

  const handleDateChange = useCallback((date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    setSelectedMonth(`${year}-${month}`);
  }, []);

  const getDaysInMonth = useCallback((year, month) => {
    const date = new Date(year, month, 0);
    const days = [];
    for (let i = 1; i <= date.getDate(); i++) {
      days.push(`${year}-${month.toString().padStart(2, "0")}-${i.toString().padStart(2, "0")}`);
    }
    return days;
  }, []);

  const [year, month] = selectedMonth.split("-");
  const daysOfMonth = getDaysInMonth(year, month);

  return (
    <div className="lg:my-10 mb-10 px-5 lg:mr-12">
      <div className="flex justify-between gap-2 h-auto">
        <h2 className="text-lg self-center xs:text-3xl font-semibold">
          Mess Bill
        </h2>
        <div className="">
          <DatePickerComponent
            selectedDate={new Date(selectedMonth + "-01")}
            onDateChange={handleDateChange}
          />
        </div>
      </div>
      <div className="divider"></div>
      <div className="md:mt-7">
        <div className="overflow-x-auto max-h-full overflow-y-scroll px-1">
          <table className="table table-sm border-collapse border border-slate-500 table-hover w-full text-center">
            <thead className="bg-gray-200 shadow-sm sticky top-0 border-b-[1px] border-slate-500">
              <tr>
                <th className="p-0 border border-slate-500">Date</th>
                <th className="p-0 border border-slate-500">Breakfast</th>
                <th className="p-0 border border-slate-500">Lunch</th>
                <th className="p-0 border border-slate-500">Dinner</th>
                <th className="p-0 border border-slate-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {daysOfMonth.map((day) => {
                const item = mealBillData.find((data) => data.date === day);
                return (
                  <React.Fragment key={day}>
                    <tr className="hover:bg-gray-100 border border-slate-500 text-center">
                      <td className="p-0 font-bold text-lg border border-slate-500">
                        {new Date(day).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-0 border border-slate-500">
                        <div className="flex flex-col">
                          <span>
                            Total Cost:{" "}
                            {item?.mealBill?.breakfast?.totalCost?.toFixed(2) || "0"}{" "}
                            ৳
                          </span>
                          <span>
                            Total Students: {item?.mealBill?.breakfast?.totalStudent || "0"}
                          </span>
                          <span>
                            Per Head: {item?.mealBill?.breakfast?.perHeadCost?.toFixed(2) || "0"}{" "}
                            ৳
                          </span>
                        </div>
                      </td>
                      <td className="p-0 border border-slate-500">
                        <div className="flex flex-col">
                          <span>
                            Total Cost:{" "}
                            {item?.mealBill?.lunch?.totalCost?.toFixed(2) || "0"}{" "}
                            ৳
                          </span>
                          <span>
                            Total Students: {item?.mealBill?.lunch?.totalStudent || "0"}
                          </span>
                          <span>
                            Per Head: {item?.mealBill?.lunch?.perHeadCost?.toFixed(2) || "0"}{" "}
                            ৳
                          </span>
                        </div>
                      </td>
                      <td className="p-0 border border-slate-500">
                        <div className="flex flex-col">
                          <span>
                            Total Cost:{" "}
                            {item?.mealBill?.dinner?.totalCost?.toFixed(2) || "0"}{" "}
                            ৳
                          </span>
                          <span>
                            Total Students: {item?.mealBill?.dinner?.totalStudent || "0"}
                          </span>
                          <span>
                            Per Head: {item?.mealBill?.dinner?.perHeadCost?.toFixed(2) || "0"}{" "}
                            ৳
                          </span>
                        </div>
                      </td>
                      <td className="p-0 border border-slate-500">
                        <div className="flex flex-col">
                          <div>
                            Total Cost:{" "}
                            {(
                              (item?.mealBill?.breakfast?.totalCost || 0) +
                              (item?.mealBill?.lunch?.totalCost || 0) +
                              (item?.mealBill?.dinner?.totalCost || 0)
                            ).toFixed(2)}{" "}
                            ৳
                          </div>
                          <div>
                            Per Head:{" "}
                            {(
                              (item?.mealBill?.breakfast?.perHeadCost || 0) +
                              (item?.mealBill?.lunch?.perHeadCost || 0) +
                              (item?.mealBill?.dinner?.perHeadCost || 0)
                            ).toFixed(2)}{" "}
                            ৳
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
              { (
                <tr className="border-t">
                  <td colSpan="4" className="text-right font-bold text-xl p-0">
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
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

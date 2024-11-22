import React from "react";
import { MealRow } from "./MealRow";
import { MealLocks } from "./MealLocks";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

export const MealTable = ({
  students,
  setStudents,
  sortBy,
  setSortBy,
  sortAsc,
  setSortAsc,
  breakfastFeast,
  lunchFeast,
  dinnerFeast,
  breakfastLock,
  lunchLock,
  dinnerLock,
  handleMealLock,
  date,
}) => {
  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(true);
    }
  };

  return (
    <div className="flex-grow overflow-auto px-1 pb-4 mb-2">
      {/* Scrollable Table */}
      <div className="flex-grow overflow-auto">
        <table className="table table-sm table-hover w-full">
          <thead className="bg-white shadow-sm sticky top-0 border-0 h-12">
            <tr>
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
              <th className="uppercase text-center">
                Meal
                <MealLocks
                  breakfastLock={breakfastLock}
                  lunchLock={lunchLock}
                  dinnerLock={dinnerLock}
                  breakfastFeast={breakfastFeast}
                  lunchFeast={lunchFeast}
                  dinnerFeast={dinnerFeast}
                  handleMealLock={handleMealLock}
                />
              </th>
              <th>
                <div className="flex flex-col items-center">
                  <div className="uppercase text-center">Guest Meal</div>
                  <div className="grid grid-cols-4 gap-1 w-full place-items-center">
                    <span className="text-center">Breakfast</span>
                    <span className="text-center">Lunch</span>
                    <span className="text-center">Dinner</span>
                    <span className="text-center">Submit</span>
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <MealRow
                key={student._id}
                student={student}
                setStudents={setStudents}
                breakfastFeast={breakfastFeast}
                lunchFeast={lunchFeast}
                dinnerFeast={dinnerFeast}
                date={date}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

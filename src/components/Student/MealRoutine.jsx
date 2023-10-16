import React, { useEffect, useState } from "react";
import { Axios } from "../../api/api";

const MealRoutine = () => {
  const [mealData, setMealData] = useState([]);

  // Define a function to make the API call
  const fetchMealRoutineData = async () => {
    try {
      const response = await Axios.get("/meal/routine"); // Replace with your API endpoint
      setMealData(response.data);
    } catch (error) {
      console.error("Error fetching meal routine data:", error);
    }
  };

  // Use the useEffect hook to fetch the data when the component mounts
  useEffect(() => {
    fetchMealRoutineData();
  }, []);

  return (
    <div className="lg:my-10 mb-10 px-5 lg:mr-12">
      <h2 className="text-3xl font-semibold">Meal Routine</h2>
      <div className="divider"></div>
      <div className="container flex justify-center items-center">
        <div className="meal-planner font-sans pt-10">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="pb-4 text-gray-500 text-center">Day</th>
                <th className="pb-4 text-gray-500 text-center">Breakfast</th>
                <th className="pb-4 text-gray-500 text-center">Lunch</th>
                <th className="pb-4 text-gray-500 text-center">Dinner</th>
              </tr>
            </thead>
            <tbody className="text-lg">
              {mealData.map((routine) => (
                <tr key={routine._id}>
                  <td className=" max-w-xs font-bold pr-4 text-gray-500 text-center">{routine.day}</td>
                  <td className=" max-w-xs pr-4 h-16 pb-4">
                    <div className="bg-gray-200 p-4 h-full break-words rounded-lg font-notoSerifBangla">{routine.breakfast}</div>
                  </td>
                  <td className=" pr-4 h-16 pb-4 max-w-xs">
                    <div className="bg-gray-200 p-4 h-full break-words rounded-lg font-notoSerifBangla">{routine.lunch}</div>
                  </td>
                  <td className=" h-16 pb-4 max-w-xs">
                    <div className="bg-gray-200 p-4 h-full break-words rounded-lg font-notoSerifBangla">{routine.dinner}</div>
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

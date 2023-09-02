import { useState } from "react";

export default function MealPlan() {
  const [meals, setMeals] = useState([
    { date: "29/08/2023", breakfast: true, lunch: true, dinner: true },
    { date: "30/08/2023", breakfast: true, lunch: false, dinner: true },
  ]);

  const handleMealToggle = (date, mealType) => {
    setMeals((prevMeals) => {
      return prevMeals.map((meal) => {
        if (meal.date === date) {
          return { ...meal, [mealType]: !meal[mealType] };
        }
        return meal;
      });
    });
  };

  return (
    <div className="lg:my-10 lg:mx-4 lg:w-2/3">
      <h2 className="text-3xl m-4 font-semibold">Meal Plan</h2>
      <div className="overflow-x-auto lg:mr-12">
        <table className="table">
          <thead>
            <tr>
              <th className="w-100">Day</th>
              <th className="w-10">Breakfast 🍳</th>
              <th className="w-10">Lunch 🍲 </th>
              <th className="w-10">Dinner 🥗</th>
            </tr>
          </thead>
          <tbody>
            {meals.map((day) => (
              <tr key={day.date} className="hover">
                <td className="">{day.date}</td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    className={`toggle ${
                      day.breakfast ? "toggle-success" : "bg-red-500"
                    }`}
                    checked={day.breakfast}
                    onChange={() => handleMealToggle(day.date, "breakfast")}
                  />
                </td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    className={`toggle ${
                      day.lunch ? "toggle-success" : "bg-red-500"
                    }`}
                    checked={day.lunch}
                    onChange={() => handleMealToggle(day.date, "lunch")}
                  />
                </td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    className={`toggle ${
                      day.dinner ? "toggle-success" : "bg-red-500"
                    }`}
                    checked={day.dinner}
                    onChange={() => handleMealToggle(day.date, "dinner")}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
    <div className="lg:my-10 lg:mx-6">
      <h2 className="text-3xl font-semibold">Meal Plan</h2>
      <div className="overflow-x-auto lg:mr-12">
        <table className="table">
          <thead>
            <tr>
              <th className="">Day</th>
              <th className="text-center lg:w-10">Breakfast 🍳</th>
              <th className="text-center lg:w-10">Lunch 🍲</th>
              <th className="text-center lg:w-10">Dinner 🥗</th>
            </tr>
          </thead>
          <tbody className="">
            {meals.map((day) => (
              <tr key={day.date} className="hover">
                <td className="">
                  {`Monday -`} <span className="text-sm">{day.date}</span>{" "}
                </td>
                {["breakfast", "lunch", "dinner"].map((mealType) => (
                  <td className="text-center" key={mealType}>
                    <input
                      type="checkbox"
                      className={`toggle ${
                        day[mealType] ? "toggle-success" : "bg-red-500"
                      }`}
                      checked={day[mealType]}
                      onChange={() => handleMealToggle(day.date, mealType)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

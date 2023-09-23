import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Axios } from "../../api/api";
import { dateToDayConverter } from "../../Utils/dateToDayConverter";
import { dateToYYYYMMDD } from "../../Utils/dateToYYYYMMDD";
export default function MealPlan() {
  const [meals, setMeals] = useState([
    // { date: "29/08/2023", breakfast: true, lunch: true, dinner: true },
    // { date: "30/08/2023", breakfast: true, lunch: false, dinner: true },
  ]);

  useEffect(() => {
    const fetchMeals = async () => {
      const res = await Axios.get("/meal/plan");
      const { meals } = res.data;
      setMeals(meals);
    };
    fetchMeals();
  }, []);

  const handleMealUpdate = async (mealId, meal) => {
    console.log("mealId", mealId);
    console.log("meal", meal);

    try {
      const res = await Axios.put(`/meal/plan/${mealId}`, { meal });
      const result = res.data;

      setMeals((prevMeals) =>
        prevMeals.map((prevMeal) => {
          if (prevMeal._id === mealId) {
            return {
              ...prevMeal,
              ...result.meal,
              meal: { ...result.meal.meal },
            };
          }
          return prevMeal;
        })
      );
      toast.success(result.message);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  const validDate = () => {
    const today = new Date();
    console.log("=>", new Date());
    const time = today.getHours();
    let dayCount = 0;
    console.log("time", time);
    if (time >= 22) {
      dayCount = 2;
    } else {
      dayCount = 1;
    }
    console.log("dayCount", dayCount);
    const availableDate = new Date();
    availableDate.setDate(today.getDate() + dayCount);
    console.log("availableDate=>", availableDate);
    return dateToYYYYMMDD(availableDate);
  };

  return (
    <div className="lg:my-10 lg:mx-6">
      <h2 className="text-3xl font-semibold">Meal Plan</h2>
      <div className="overflow-x-auto lg:mr-12">
        <table className="table">
          <thead>
            <tr>
              <th className="w-3/4">Day</th>
              <th className="text-center md:!p-4 !p-2  md:w-10">
                Breakfast 🍳
              </th>
              <th className="text-center md:!p-4 !p-2  md:w-10">Lunch 🍲</th>
              <th className="text-center md:!p-4 !p-2  md:w-10">Dinner 🥗</th>
            </tr>
          </thead>
          <tbody className="">
            {meals.map((meal) => (
              <tr
                key={meal._id}
                className={` ${
                  validDate() == meal.date
                    ? "bg-emerald-200  cursor-pointer"
                    : "bg-gray-100 grayscale pointer-events-none cursor-not-allowed"
                }`}
              >
                <td className="md:text-lg font-medium">
                  {`${dateToDayConverter(meal.date)} - `}
                  <span className="">{meal.date}</span>
                </td>
                {["breakfast", "lunch", "dinner"].map((mealType) => (
                  <td
                    className="text-center checkbox-wrapper-26"
                    key={mealType}
                  >
                    <input
                      checked={meal.meal[mealType]}
                      onChange={() =>
                        handleMealUpdate(meal._id, {
                          ...meal.meal,
                          [mealType]: !meal.meal[mealType],
                        })
                      }
                      type="checkbox"
                      id={`_checkbox-${meal._id}-${mealType}`}
                    />
                    <label htmlFor={`_checkbox-${meal._id}-${mealType}`}>
                      <div className="tick_mark"></div>
                    </label>
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

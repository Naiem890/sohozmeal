import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Axios } from "../../api/api";
import { dateToDayConverter } from "../../Utils/dateToDayConverter";
import { dateToYYYYMMDD } from "../../Utils/dateToYYYYMMDD";
import {
  ArrowLeftCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export default function MealPlan() {
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    const fetchMeals = async () => {
      const res = await Axios.get("/meal/plan");
      const { meals } = res.data;

      const day = new Date(meals[0].date).getDay();
      const emptyDays = Array(day).fill(null);
      meals.unshift(...emptyDays);
      setMeals(meals);
    };
    fetchMeals();
  }, []);

  const handleMealUpdate = async (mealId, meal) => {
    try {
      const res = await Axios.put(`/meal/plan/${mealId}`, { meal });
      const result = res.data;

      setMeals((prevMeals) =>
        prevMeals.map((prevMeal) => {
          if (prevMeal?._id === mealId) {
            return result.meal;
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
    const time = today.getHours();
    let dayCount = time >= 22 ? 2 : 1;
    const availableDate = new Date();
    availableDate.setDate(today.getDate() + dayCount);
    return dateToYYYYMMDD(availableDate);
  };

  return (
    <div className="lg:my-10 px-5 lg:mr-12">
      <h2 className="text-3xl font-semibold">Meal Plan</h2>
      <div className="divider"></div>
      <div className="flex justify-between items-center mb-6 gap-10 flex-wrap">
        <div className="flex gap-2 md:gap-4 flex-wrap">
          {["breakfast", "lunch", "dinner"].map((mealType, index) => (
            <div
              key={mealType}
              className={`relative flex justify-center items-center gap-3 rounded-md px-4 py-2  text-white ${
                index === 0
                  ? "bg-gradient-to-br from-blue-300 to-blue-500"
                  : index === 1
                  ? "bg-gradient-to-br from-orange-300 to-orange-500"
                  : "bg-gradient-to-br from-zinc-400 to-zinc-500"
              }`}
            >
              <div className="font-semibold capitalize">{mealType}</div>
              <div className="font-bold md:text-2xl">
                {meals.filter((meal) => meal?.meal[mealType]).length}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center items-center gap-10 md:mx-0 mx-auto">
          <button>
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h2 className="text-2xl font-semibold">September 2023</h2>
          </div>
          <button>
            <ArrowRightIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
      <div className="md:mt-16">
        <div className="md:grid grid-cols-1 md:grid-cols-7 gap-x-6 gap-y-6 hidden">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-bold text-gray-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-y-3 gap-x-3 lg:gap-x-6 lg:gap-y-6 mt-6">
          {meals.map((meal, i) =>
            meal?._id ? (
              <div
                key={meal._id}
                className={`flex justify-between items-center gap-3 flex-wrap px-4 py-3 md:py-6 rounded-xl shadow border border-gray-50 ${
                  validDate() === meal.date
                    ? "bg-emerald-50 font-medium"
                    : "grayscale pointer-events-none cursor-not-allowed !font-light"
                }`}
              >
                <div className="text-center flex gap-6">
                  <span className="w-6 md:hidden">
                    {dateToDayConverter(meal.date)}
                  </span>
                  <span className="md:hidden">{meal.date}</span>
                  <span className="hidden md:inline text-lg font-bold">
                    {meal.date.split("-")[2]}
                  </span>
                </div>
                <div className="flex gap-6">
                  {["breakfast", "lunch", "dinner"].map((mealType) => (
                    <div
                      className="text-center checkbox-wrapper-26"
                      key={mealType}
                    >
                      <input
                        checked={meal.meal[mealType]}
                        onChange={() =>
                          handleMealUpdate(meal._id, {
                            [mealType]: !meal.meal[mealType],
                          })
                        }
                        type="checkbox"
                        id={`_checkbox-${meal._id}-${mealType}`}
                      />
                      <label htmlFor={`_checkbox-${meal._id}-${mealType}`}>
                        <div className="tick_mark"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div key={i} className="hidden md:block"></div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

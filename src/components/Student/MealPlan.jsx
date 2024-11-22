import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useCallback, useEffect, useState } from "react";
import { dateToDayConverter } from "../../Utils/dateToDayConverter";
import { dateToYYYYMMDD } from "../../Utils/dateToYYYYMMDD";
import formatDate from "../../Utils/formatDateString";
import { Axios } from "../../api/api";
import toast from "react-hot-toast";

export default function MealPlan() {
  const [meals, setMeals] = useState([]);
  const [distinctMonths, setDistinctMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [guestMeal, setGuestMeal] = useState({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
  });
  const [originalGuestMeal, setOriginalGuestMeal] = useState(null); // for resetting the guest meal on modal close

  const handleMealUpdate = async (mealId, meal) => {
    try {
      const result = await toast.promise(
        Axios.put(`/meal/plan/${mealId}`, { meal }),
        {
          loading: "Meal Updating...",
          success: ({ data }) => data.message || "Meal updated successfully!",
          error: (error) =>
            error?.response?.data?.message || "Failed to update meal.",
        }
      );

      if (result.status === 200) {
        setMeals((prevMeals) =>
          prevMeals.map((prevMeal) =>
            prevMeal?._id === mealId ? result.data.meal : prevMeal
          )
        );
      }
    } catch (error) {
      console.error("Meal update error: ", error);
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

  const handleMonthChange = useCallback(
    (increment) => {
      setSelectedMonth((prevMonth) => {
        const index = distinctMonths.indexOf(prevMonth);
        const newIndex = index + increment;
        return distinctMonths[
          newIndex >= 0 && newIndex < distinctMonths.length ? newIndex : index
        ];
      });
    },
    [distinctMonths]
  );

  const handleModalOpen = () => {
    setOriginalGuestMeal({ ...guestMeal });
    document.getElementById("my_modal_3").showModal();
  };
  const handleGuestCountChange = (e) => {
    const { name, value } = e.target;

    const sanitizedValue =
      value === "" ? "" : Math.max(0, Math.floor(Number(value)));

    setGuestMeal((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const handleModalClose = useCallback(() => {
    if (originalGuestMeal) {
      setGuestMeal({ ...originalGuestMeal });
    }
    document.getElementById("my_modal_3").close();
  }, [originalGuestMeal]);

  const handleSubmitGuestMeal = async () => {
    try {
      const result = await toast.promise(
        Axios.put("/meal/guest-meal", {
          date: validDate(),
          guestMeal,
        }),
        {
          loading: "Submitting Guest Meal...",
          success: ({ data }) => data.message || "Guest meal submitted!",
          error: (error) =>
            error?.response?.data?.message || "Failed to submit guest meal.",
        }
      );

      if (result.status === 200) {
        setMeals((prevMeals) =>
          prevMeals.map((prevMeal) =>
            prevMeal.date === validDate() ? result.data.meal : prevMeal
          )
        );
        setGuestMeal(result.data.meal.guestMeal);
        document.getElementById("my_modal_3").close();
      }
    } catch (error) {
      console.error("Guest meal submit error: ", error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleModalClose();
      }
    };
    const fetchDistinctMonths = async () => {
      const res = await Axios.get("/meal/months");
      const months = res.data;
      setDistinctMonths(months);
      setSelectedMonth(months.slice(-1)[0]);
    };
    fetchDistinctMonths();

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  useEffect(() => {
    const fetchMeals = async () => {
      if (selectedMonth) {
        const year = selectedMonth.split("-")[0];
        const month = selectedMonth.split("-")[1];
        const res = await Axios.get(`/meal/plan?year=${year}&month=${month}`);
        if (res.status === 200) {
          const guestMeal = res.data.meals.find(
            (meal) => meal.date === validDate()
          )?.guestMeal;
          setGuestMeal(guestMeal || { breakfast: 0, lunch: 0, dinner: 0 });
        }
        const { meals } = res.data;

        const day = new Date(meals[0].date).getDay();
        const emptyDays = Array(day).fill(null);
        meals.unshift(...emptyDays);
        setMeals(meals);
      }
    };
    fetchMeals();
  }, [selectedMonth]);

  return (
    <div className="lg:my-10 mb-10 px-5">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold">Meal Plan</h2>
        <button
          onClick={handleModalOpen}
          className="text-lg font-bold bg-emerald-500 px-4 py-2 text-white rounded-md hover:bg-emerald-600 transition-all duration-300"
        >
          Guest Meal
        </button>
      </div>
      <div className="divider my-2"></div>
      <div className="flex justify-between items-center mb-6 gap-10 flex-wrap">
        <div className="flex gap-2 md:gap-4 sm:w-auto w-full">
          {["breakfast", "lunch", "dinner"].map((mealType, index) => (
            <div
              key={mealType}
              className={`relative flex justify-center items-center gap-2 rounded-md px-4 py-2 flex-1 text-white ${
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
          <button
            className={`${
              selectedMonth === distinctMonths[0]
                ? "opacity-25 pointer-events-none cursor-not-allowed disabled"
                : ""
            }`}
            onClick={() => handleMonthChange(-1)}
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h2 className="text-xl font-semibold">
              {formatDate(selectedMonth)}
            </h2>
          </div>
          <button
            className={`${
              selectedMonth === distinctMonths.slice(-1)[0]
                ? "opacity-25 pointer-events-none cursor-not-allowed disabled" +
                  distinctMonths.slice(-1)
                : "" + distinctMonths.slice(-1)
            }`}
            onClick={() => handleMonthChange(1)}
          >
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
                className={`flex justify-between items-center gap-3 flex-wrap px-4 py-3 md:py-6 rounded-xl shadow border-2 ${
                  validDate() === meal.date
                    ? "bg-emerald-50 border-emerald-200 font-bold"
                    : "border-gray-100 grayscale pointer-events-none cursor-not-allowed"
                }`}
              >
                <div className="text-center flex gap-6">
                  <span className="w-6 md:hidden">
                    {dateToDayConverter(meal.date)}
                  </span>
                  <span className="md:hidden">{meal.date}</span>
                  <span className="hidden md:inline text-lg">
                    {meal.date.split("-")[2]}
                  </span>
                </div>
                <div
                  className={`flex justify-between gap-6 md:gap-[0.65rem] flex-wrap ${
                    validDate() !== meal.date && "opacity-50"
                  }`}
                >
                  {["breakfast", "lunch", "dinner"].map((mealType, i) => (
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
                        className={`${
                          meal.permission && meal?.permission[i] ? "locked" : ""
                        }`}
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
      <dialog id="my_modal_3" className="modal z-10">
        <div className="modal-box">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={handleModalClose}
            >
              ✕
            </button>
          </form>
          <h3 className="font-bold text-lg text-emerald-800">
            Guest Meal for {validDate()}
          </h3>
          <div className="flex flex-col gap-4">
            <div>
              {["breakfast", "lunch", "dinner"].map((meal) => (
                <label key={meal} className="form-control w-full">
                  <div className="label">
                    <span className="label-text">
                      {meal.charAt(0).toUpperCase() + meal.slice(1)}
                    </span>
                  </div>
                  <input
                    name={meal}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Number of Guests"
                    value={guestMeal[meal]}
                    onChange={(e) => handleGuestCountChange(e)}
                    onKeyDown={(e) => {
                      if (["-", ".", "e", "E"].includes(e.key))
                        e.preventDefault();
                    }}
                    className="input input-bordered focus:ring-emerald-800 focus:ring-1 focus:border-0 border-emerald-950 w-full rounded-lg"
                  />
                </label>
              ))}
            </div>
            <button
              className="text-lg font-bold bg-emerald-500 px-4 py-2 text-white rounded-md hover:bg-emerald-600 transition-all duration-300"
              onClick={handleSubmitGuestMeal}
            >
              Submit
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

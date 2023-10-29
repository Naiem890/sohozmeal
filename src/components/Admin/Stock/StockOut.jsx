import React, { useState } from "react";
import { fixedButtonClass, fixedInputClass } from "../../../Utils/constant";
import { Axios } from "../../../api/api";
import toast from "react-hot-toast";

export const StockOut = ({ stocks, refetchHandler }) => {
  const handleStockOut = async (e) => {
    e.preventDefault();

    const quantity = +e.target.quantity.value;
    const stockId = e.target.item.value;
    const meal = e.target.meal.value;
    const date = e.target.date.value;

    try {
      const response = await Axios.post(`/stock/out/${stockId}`, {
        quantityToReduce: quantity,
        meal,
        date,
      });
      toast.success(response.data.message);
      refetchHandler();
    } catch (error) {
      toast.error(error.response.data.error);
    }
  };

  return (
    <form onSubmit={handleStockOut} className="">
      <div className="flex gap-2 flex-wrap">
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Date
          </label>
          <input
            required
            className={`${fixedInputClass} disabled:bg-gray-200 !text-xs h-9 mt-2`}
            type="date"
            name="date"
            defaultValue={new Date().toISOString().split("T")[0]}
          />
        </div>
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Meal
          </label>
          <select
            required
            name="meal"
            className={`${fixedInputClass} disabled:bg-gray-200 !text-xs h-9 disabled:bg-gray-200-200 mt-2`}
          >
            <option value="" disabled selected>
              Meal
            </option>
            {["BREAKFAST", "LUNCH", "DINNER"].map((meal) => (
              <option key={meal} value={meal}>
                {meal}
              </option>
            ))}
          </select>
        </div>
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Item
          </label>
          <select
            required
            name="item"
            className={`${fixedInputClass} disabled:bg-gray-200 !text-xs h-9 disabled:bg-gray-200-200 mt-2`}
          >
            <option value="" disabled selected>
              Item
            </option>
            {stocks.map(({ item, _id }) => (
              <option key={_id} value={_id}>
                {item.name} - {item.unit}
              </option>
            ))}
          </select>
        </div>

        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Quantity
          </label>
          <input
            className={`${fixedInputClass} disabled:bg-gray-200 !text-xs h-9 mt-2`}
            type="number"
            name="quantity"
            placeholder="eg: 10"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button
          type="submit"
          className={`${fixedButtonClass} btn-xs sm:w-24 !h-9`}
        >
          Stock Out
        </button>
      </div>
    </form>
  );
};

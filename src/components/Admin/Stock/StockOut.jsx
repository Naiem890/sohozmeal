import React, { useState } from "react";
import { fixedButtonClass, fixedInputClass } from "../../../Utils/constant";
import { Axios } from "../../../api/api";
import toast from "react-hot-toast";

export const StockOut = ({ stockItems, refetchHandler }) => {
  const [selectedItem, setSelectedItemId] = useState(stockItems[0]);

  const handleStockOut = async (e) => {
    e.preventDefault();
    const quantity = +e.target.quantity.value;
    const item = selectedItem._id;
    try {
      const response = await Axios.post(`/stock/out/${item}`, {
        quantityToReduce: quantity,
      });
      toast.success("Stock out completed successfully!");
      refetchHandler();
    } catch (error) {
      toast.error(error.response.data.error);
    }
  };
  const handleItemSelect = (event) => {
    const selectedItem = event.target.value;
    const selectedItemObject = stockItems.find(
      (item) => item._id === selectedItem
    );
    setSelectedItemId(selectedItemObject);
  };

  return (
    <form onSubmit={handleStockOut} className="">
      <div className="flex gap-2">
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Date
          </label>
          <input
            className={`${fixedInputClass} disabled:bg-gray-200 !text-xs h-9 mt-2`}
            type="date"
            placeholder="eg: kg"
          />
        </div>
        <div className="grow">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Meal
          </label>
          <select
            required
            name="unit"
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
            name="unit"
            className={`${fixedInputClass} disabled:bg-gray-200 !text-xs h-9 disabled:bg-gray-200-200 mt-2`}
            onChange={handleItemSelect}
          >
            <option value="" disabled selected>
              Item
            </option>
            {stockItems.map((item) => (
              <option key={item._id} value={item._id}>
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

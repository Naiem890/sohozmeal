import React, { useState } from "react";
import { fixedButtonClass, fixedInputClass } from "../../../Utils/constant";
import toast from "react-hot-toast";
import { Axios } from "../../../api/api";

export const StockIn = ({ stockItems, refetchHandler }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  const handleStockIn = async (e) => {
    e.preventDefault();
    console.log(selectedItem);
    const quantity = +e.target.quantity.value;
    const price = +e.target.price.value;
    const item = selectedItem._id;
    console.log(item, quantity, price);

    try {
      await Axios.post("/stock", {
        stock: {
          item,
          quantity,
          price,
        },
      });
      toast.success("Stock added successfully!");
      refetchHandler();
      reset();
      e.target.reset();
    } catch (error) {
      console.error("Error while adding stock:", error);
      toast.error(error.response.data.error);
    }
  };

  const reset = () => {
    setSelectedItem(null);
  };
  return (
    <form onSubmit={handleStockIn} className="">
      <div className="flex gap-2">
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Item
          </label>
          <select
            required
            value={selectedItem?._id || ""}
            onChange={(e) =>
              setSelectedItem(() =>
                stockItems.find((item) => item._id === e.target.value)
              )
            }
            name="unit"
            className={`${fixedInputClass} disabled:bg-gray-200 !text-xs h-9 disabled:bg-gray-200-200 mt-2`}
          >
            <option value="" disabled selected>
              Item
            </option>
            {stockItems.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Unit
          </label>
          <input
            className={`${fixedInputClass} disabled:bg-gray-200 !text-xs h-9 mt-2`}
            type="text"
            value={selectedItem?.unit}
            placeholder="eg: kg"
            disabled
          />
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
        <div className="">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Price Per Unit
          </label>
          <input
            className={`${fixedInputClass} disabled:bg-gray-200 !text-xs h-9 mt-2`}
            type="number"
            name="price"
            placeholder="eg: 100"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button
          type="submit"
          className={`${fixedButtonClass} btn-xs sm:w-20 !h-9`}
        >
          Stock In
        </button>
      </div>
    </form>
  );
};

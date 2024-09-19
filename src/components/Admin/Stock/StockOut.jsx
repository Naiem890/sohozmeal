import React, { useEffect, useState } from "react";
import { fixedButtonClass, fixedInputClass } from "../../../Utils/constant";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

export const StockOut = ({
  stocks,
  addTransaction,
  wing,
  editTransaction,
  setSummarySelectedItem,
}) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [meal, setMeal] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Prefill form fields when editing a transaction
  useEffect(() => {
    if (editTransaction) {
      const { item, quantity, meal, date } = editTransaction.transaction;
      const stockItem = stocks.find((stock) => stock.item.name === item);
      setSelectedItem(stockItem);
      setQuantity(quantity);
      setMeal(meal);
      setDate(date);
    }
  }, [editTransaction, stocks]);

  const handleStockOut = (e) => {
    e.preventDefault();

    if (!selectedItem) {
      toast.error("Please select a valid item");
      return;
    }

    // SweetAlert confirmation before proceeding
    Swal.fire({
      title: "Confirm Stock Out",
      text: `Do you want to stock out ${quantity} unit(s) for ${meal} on ${date}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, add to transaction!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        // Add the transaction locally
        const transaction = {
          type: "OUT",
          item: selectedItem.item._id,
          name: selectedItem.item.name,
          quantity,
          meal,
          date,
          category: "STORED",
          wing,
        };

        // Add or update the transaction in local state
        addTransaction(transaction);
        toast.success(
          editTransaction
            ? "Stock out transaction updated!"
            : "Stock out transaction added locally!"
        );

        // Reset the form
        resetForm();
        e.target.reset();
      } else {
        toast.info("Stock out action was canceled.");
      }
    });
  };

  const resetForm = () => {
    setSelectedItem(null);
    setQuantity("");
    setMeal("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <form onSubmit={handleStockOut} className="mb-4">
      {/* First row - Inputs */}
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
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
            value={meal}
            onChange={(e) => setMeal(e.target.value)}
          >
            <option value="" disabled>
              Meal
            </option>
            {["BREAKFAST", "LUNCH", "DINNER"].map((mealOption) => (
              <option key={mealOption} value={mealOption}>
                {mealOption}
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
            value={selectedItem?._id || ""}
            onChange={(e) => {
              const seletedStock = stocks.find(
                (stock) => stock._id === e.target.value
              );
              setSummarySelectedItem(seletedStock?.item);
              setSelectedItem(() => seletedStock);
            }}
          >
            <option value={null}>Item</option>
            {stocks.map(({ item, _id }) => (
              <option key={_id} value={_id}>
                {item?.name} - {item?.unit}
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
            step="any"
            placeholder="eg: 10"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Second row - Stock Out button */}
      <div className="flex justify-start mt-4">
        <button
          type="submit"
          className={`${fixedButtonClass} btn-xs sm:w-24 !h-9`}
        >
          {editTransaction ? "Update" : "Stock Out"}
        </button>
      </div>
    </form>
  );
};

import React, { useEffect, useState } from "react";
import { fixedButtonClass, fixedInputClass } from "../../../Utils/constant";
import toast from "react-hot-toast";

export const NonStock = ({
  stockItems,
  addTransaction,
  wing,
  editTransaction,
}) => {
  const [selectedItem, setSelectedItem] = useState(stockItems[0]);
  const [quantity, setQuantity] = useState("");
  const [meal, setMeal] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [price, setPrice] = useState("");

  // UseEffect to prefill the form fields if editTransaction exists
  useEffect(() => {
    if (editTransaction) {
      const { item, quantity, meal, date, price } = editTransaction.transaction;
      const selectedItemObject = stockItems.find((i) => i.name === item);
      setSelectedItem(selectedItemObject);
      setQuantity(quantity);
      setMeal(meal);
      setDate(date);
      setPrice(price);
    }
  }, [editTransaction, stockItems]);

  const handleStockOut = (e) => {
    e.preventDefault();

    if (!selectedItem) {
      toast.error("Please select a valid item.");
      return;
    }

    // Create a transaction object
    const transaction = {
      type: "OUT",
      item: selectedItem._id,
      name: selectedItem.name,
      quantity,
      meal,
      date,
      price,
      category: "NON_STORED",
      wing,
    };

    // Add transaction to the local transaction list
    addTransaction(transaction);
    toast.success(
      editTransaction
        ? "Non-stock transaction updated locally!"
        : "Non-stock transaction added locally!"
    );

    // Reset the form
    resetForm();
    e.target.reset();
  };

  const resetForm = () => {
    setSelectedItem(stockItems[0]);
    setQuantity("");
    setMeal("");
    setDate(new Date().toISOString().split("T")[0]);
    setPrice("");
  };

  const handleItemSelect = (event) => {
    const selectedItem = event.target.value;
    const selectedItemObject = stockItems.find(
      (item) => item._id === selectedItem
    );
    setSelectedItem(selectedItemObject);
  };

  return (
    <form onSubmit={handleStockOut} className="mb-4">
      {/* Container for all fields, using flexbox */}
      <div className="flex flex-wrap gap-2">
        {/* Date Field */}
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

        {/* Meal Type Field */}
        <div className="w-32">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Meal
          </label>
          <select
            required
            name="mealType"
            className={`${fixedInputClass} !text-xs h-9 mt-2 w-full`}
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

        {/* Item Field */}
        <div className="w-40">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Item
          </label>
          <select
            required
            name="unit"
            className={`${fixedInputClass} !text-xs h-9 mt-2 w-full`}
            onChange={handleItemSelect}
            value={selectedItem?._id || ""}
          >
            <option value="" disabled>
              Item
            </option>
            {stockItems.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} - {item.unit}
              </option>
            ))}
          </select>
        </div>

        {/* Price Field */}
        <div className="w-28">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Price (per unit)
          </label>
          <input
            className={`${fixedInputClass} !text-xs h-9 mt-2 w-full`}
            type="number"
            name="price"
            step="any"
            placeholder="eg: 10"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        {/* Quantity Field */}
        <div className="w-28">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Quantity
          </label>
          <input
            className={`${fixedInputClass} !text-xs h-9 mt-2 w-full`}
            type="number"
            name="quantity"
            step="any"
            placeholder="eg: 100"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Stock Out Button (placed on a new row) */}
      <div className="mt-4">
        <button
          type="submit"
          className={`${fixedButtonClass} btn-xs sm:w-24 !h-9 w-full`}
        >
          {editTransaction ? "Update" : "Stock Out"}
        </button>
      </div>
    </form>
  );
};

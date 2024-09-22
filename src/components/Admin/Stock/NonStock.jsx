import React, { useEffect, useRef, useState } from "react";
import { fixedButtonClass, fixedInputClass } from "../../../Utils/constant";
import toast from "react-hot-toast";

export const NonStock = ({
  stockItems,
  addTransaction,
  wing,
  editTransaction,
  childRef, // Pass childRef here
  submitRef,
  nonStockSubmit,
}) => {
  const [selectedItem, setSelectedItem] = useState(stockItems[0]);
  const [quantity, setQuantity] = useState("");
  const [meal, setMeal] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [price, setPrice] = useState("");

  // Refs for focusing elements
  const dateRef = useRef(null);
  const mealRef = useRef(null);
  const itemRef = useRef(null);
  const priceRef = useRef(null);
  const quantityRef = useRef(null);

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

  // Assign childRef to the date input (first child element)
  useEffect(() => {
    if (childRef) {
      childRef.current = dateRef.current; // Assigning childRef to dateRef
    }
  }, [childRef]);

  // Focus on the Date input when no other field has focus
  useEffect(() => {
    if (document.activeElement === document.body) {
      dateRef.current?.focus();
    }
  }, []);

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

    // Reset the form, except the date
    resetForm();
  };

  const resetForm = () => {
    setSelectedItem(stockItems[0]);
    setQuantity("");
    setMeal("");
    setPrice("");
    setTimeout(() => itemRef.current?.focus(), 0); // Focus on the item field after reset
  };

  // Handle keyboard navigation with arrow keys
  const handleKeyDown = (e, nextRef, prevRef) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      nextRef?.current?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      prevRef?.current?.focus();
    }
  };

  const handleItemSelect = (event) => {
    const selectedItem = event.target.value;
    const selectedItemObject = stockItems.find(
      (item) => item._id === selectedItem
    );
    setSelectedItem(selectedItemObject);
    setTimeout(() => priceRef.current?.focus(), 0); // Focus on price after item selection
  };

  return (
    <form onSubmit={handleStockOut} className="mb-4">
      {/* Container for all fields, using flexbox */}
      <div className="flex flex-wrap gap-2">
        {/* Date Field */}
        <div className="">
          <label className="block text-md font-medium leading-6 text-gray-600">
            Date
          </label>
          <input
            ref={dateRef} // Ref for focusing
            required
            className={`${fixedInputClass} disabled:bg-gray-200 !text-md h-9 mt-2`}
            type="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, mealRef, null)} // Navigate between Date and Meal
          />
        </div>

        {/* Meal Type Field */}
        <div className="w-32">
          <label className="block text-md font-medium leading-6 text-gray-600">
            Meal
          </label>
          <select
            ref={mealRef} // Ref for focusing
            required
            name="mealType"
            className={`${fixedInputClass} !text-md h-9 mt-2 w-full`}
            value={meal}
            onChange={(e) => setMeal(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, itemRef, dateRef)} // Navigate between Meal and Date
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
          <label className="block text-md font-medium leading-6 text-gray-600">
            Item
          </label>
          <select
            ref={itemRef} // Ref for focusing
            required
            name="unit"
            className={`${fixedInputClass} !text-md h-9 mt-2 w-full`}
            onChange={handleItemSelect}
            value={selectedItem?._id || ""}
            onKeyDown={(e) => handleKeyDown(e, priceRef, mealRef)} // Navigate between Item and Meal
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
          <label className="block text-md font-medium leading-6 text-gray-600">
            Price (per unit)
          </label>
          <input
            ref={priceRef} // Ref for focusing
            className={`${fixedInputClass} !text-md h-9 mt-2 w-full`}
            type="number"
            name="price"
            step="any"
            placeholder="eg: 10"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            onKeyDown={(e) => handleKeyDown(e, quantityRef, itemRef)} // Navigate between Price and Item
          />
        </div>

        {/* Quantity Field */}
        <div className="w-28">
          <label className="block text-md font-medium leading-6 text-gray-600">
            Quantity
          </label>
          <input
            ref={quantityRef} // Ref for focusing
            className={`${fixedInputClass} !text-md h-9 mt-2 w-full`}
            type="number"
            name="quantity"
            step="any"
            placeholder="eg: 100"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            onKeyDown={(e) => handleKeyDown(e, nonStockSubmit, priceRef)} // Navigate between Quantity and Price
          />
        </div>
      </div>

      {/* Stock Out Button (placed on a new row) */}
      <div className="mt-4">
        <button
          ref={nonStockSubmit} // Ref for focusing
          type="submit"
          className={`${fixedButtonClass} btn-xs sm:w-24 !h-9 w-full`}
          onKeyDown={(e) => handleKeyDown(e, submitRef, quantityRef)} // Navigate on Enter
        >
          {editTransaction ? "Update" : "Stock Out"}
        </button>
      </div>
    </form>
  );
};

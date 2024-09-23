import React, { useEffect, useRef, useState } from "react";
import { fixedButtonClass, fixedInputClass } from "../../../Utils/constant";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

export const StockOut = ({
  stocks,
  addTransaction,
  wing,
  editTransaction,
  setSummarySelectedItem,
  childRef, // Pass childRef here
  submitRef,
  stockOutSubmit,
}) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [meal, setMeal] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Refs for focusing elements
  const dateRef = useRef(null);
  const mealRef = useRef(null);
  const itemRef = useRef(null);
  const quantityRef = useRef(null);

  // Prefill form fields when editing a transaction
  useEffect(() => {
    if (editTransaction) {
      const { item, quantity, meal, date } = editTransaction.transaction;
      const stockItem = stocks.find((stock) => stock.item._id === item);
      setSelectedItem(stockItem);
      setQuantity(quantity);
      setMeal(meal);
      setDate(date);
    }
  }, [editTransaction, stocks]);

  // Assign childRef to the date input (first child element)
  useEffect(() => {
    if (childRef) {
      childRef.current = dateRef.current;
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

        // Reset the form but keep the selected date
        resetForm();
      } else {
        toast.info("Stock out action was canceled.");
      }
    });
  };

  const resetForm = () => {
    setSelectedItem(null);
    setQuantity("");
    setMeal("");
    // Do not reset the date, so it persists after submission
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

  return (
    <form onSubmit={handleStockOut} className="mb-4">
      {/* First row - Inputs */}
      <div className="flex gap-2 flex-wrap">
        {/* Date Field */}
        <div className="">
          <label className="block text-md font-medium leading-6 text-gray-600">
            Date
          </label>
          <input
            ref={dateRef} // Reference for auto-focus and childRef assignment
            required
            className={`${fixedInputClass} disabled:bg-gray-200 !text-md h-9 mt-2`}
            type="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, mealRef, null)} // Arrow navigation between Date and Meal
          />
        </div>

        {/* Meal Dropdown Field */}
        <div className="">
          <label className="block text-md font-medium leading-6 text-gray-600">
            Meal
          </label>
          <select
            ref={mealRef}
            required
            name="meal"
            className={`${fixedInputClass} disabled:bg-gray-200 !text-md h-9 disabled:bg-gray-200-200 mt-2`}
            value={meal}
            onChange={(e) => setMeal(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, itemRef, dateRef)} // Arrow navigation between Meal and Date
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

        {/* Item Dropdown Field */}
        <div className="">
          <label className="block text-md font-medium leading-6 text-gray-600">
            Item
          </label>
          <select
            ref={itemRef}
            required
            name="item"
            className={`${fixedInputClass} disabled:bg-gray-200 !text-md h-9 disabled:bg-gray-200-200 mt-2`}
            value={selectedItem?._id || ""}
            onChange={(e) => {
              const selectedStock = stocks.find(
                (stock) => stock._id === e.target.value
              );
              setSummarySelectedItem(selectedStock?.item);
              setSelectedItem(() => selectedStock);
              setTimeout(() => quantityRef.current?.focus(), 0); // Focus on quantity after selection
            }}
            onKeyDown={(e) => handleKeyDown(e, quantityRef, mealRef)} // Arrow navigation between Item and Meal
          >
            <option value={null}>Item</option>
            {stocks.map(({ item, _id }) => (
              <option key={_id} value={_id}>
                {item?.name} - {item?.unit}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity Field */}
        <div className="">
          <label className="block text-md font-medium leading-6 text-gray-600">
            Quantity
          </label>
          <input
            ref={quantityRef}
            className={`${fixedInputClass} disabled:bg-gray-200 !text-md h-9 mt-2`}
            type="number"
            name="quantity"
            step="any"
            placeholder="eg: 10"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            onKeyDown={(e) => handleKeyDown(e, stockOutSubmit, itemRef)} // Arrow navigation between Quantity and Item
          />
        </div>
      </div>

      {/* Second row - Stock Out button */}
      <div className="flex justify-start mt-4">
        <button
          ref={stockOutSubmit}
          type="submit"
          className={`${fixedButtonClass} btn-xs sm:w-24 !h-9`}
          onKeyDown={(e) => handleKeyDown(e, submitRef, quantityRef)} // Submit on Enter
        >
          {editTransaction ? "Update" : "Stock Out"}
        </button>
      </div>
    </form>
  );
};

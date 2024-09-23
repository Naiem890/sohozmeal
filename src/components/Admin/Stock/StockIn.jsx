import React, { useEffect, useRef, useState } from "react";
import { fixedButtonClass, fixedInputClass } from "../../../Utils/constant";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

export const StockIn = ({
  stockItems,
  addTransaction,
  wing,
  editTransaction,
  summarySelectedItem,
  setSummarySelectedItem,
  childRef, // Pass childRef here
  submitRef,
  stockInSubmit,
}) => {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Refs for auto-focus
  const dateRef = useRef(null);
  const itemRef = useRef(null);
  const quantityRef = useRef(null);
  const priceRef = useRef(null);

  // Assign childRef to the date input (first child element)
  useEffect(() => {
    if (childRef) {
      childRef.current = dateRef.current;
    }
  }, [childRef]);

  useEffect(() => {
    if (editTransaction) {
      const { item, quantity, price, date } = editTransaction.transaction;
      const selectedItem = stockItems.find((i) => i._id === item);
      console.log(stockItems, item, "kkkjkj");
      setSummarySelectedItem(selectedItem);
      setQuantity(quantity);
      setPrice(price);
      setDate(date);
    }
  }, [editTransaction, stockItems, setSummarySelectedItem]);

  const handleStockIn = (e) => {
    e.preventDefault();

    if (!summarySelectedItem) {
      toast.error("Please select a valid item");
      return;
    }

    Swal.fire({
      title: "Confirm Stock In",
      text: `Are you sure you want to add ${quantity} of ${summarySelectedItem?.name} for ${price} per unit?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, add it!",
    }).then((result) => {
      if (result.isConfirmed) {
        const transaction = {
          type: "IN",
          item: summarySelectedItem._id,
          name: summarySelectedItem.name,
          quantity,
          price,
          date,
          wing,
        };

        addTransaction(transaction);
        toast.success(
          editTransaction
            ? "Transaction updated!"
            : "Transaction added locally!"
        );

        reset();
      }
    });
  };

  const reset = () => {
    setSummarySelectedItem(null);
    setQuantity("");
    setPrice("");
    setTimeout(() => dateRef.current?.focus(), 0);
  };

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
    <form onSubmit={handleStockIn} className="mb-4">
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
            onKeyDown={(e) => handleKeyDown(e, itemRef, null)} // Arrow navigation from Date to Item
          />
        </div>

        {/* Item Dropdown Field */}
        <div className="w-40">
          <label className="block text-md font-medium leading-6 text-gray-600">
            Item
          </label>
          <select
            ref={itemRef}
            required
            value={summarySelectedItem?._id || ""}
            onChange={(e) => {
              const selectedItem = stockItems.find(
                (item) => item._id === e.target.value
              );
              setSummarySelectedItem(selectedItem);
              setTimeout(() => quantityRef.current?.focus(), 0); // Focus on quantity after selection
            }}
            onKeyDown={(e) => handleKeyDown(e, quantityRef, dateRef)} // Arrow navigation between Item and Date
            name="unit"
            className={`${fixedInputClass} disabled:bg-gray-200 !text-md h-9 disabled:bg-gray-200-200 mt-2 w-full`}
          >
            <option value="">Item</option>
            {stockItems.map(
              (item) =>
                item.category === "STORED" && (
                  <option key={item._id} value={item._id}>
                    {item.name} - {item.unit}
                  </option>
                )
            )}
          </select>
        </div>

        {/* Quantity Field */}
        <div className="w-28">
          <label className="block text-md font-medium leading-6 text-gray-600">
            Quantity
          </label>
          <input
            ref={quantityRef}
            className={`${fixedInputClass} disabled:bg-gray-200 !text-md h-9 mt-2 w-full`}
            type="number"
            name="quantity"
            step="any"
            placeholder="eg: 10"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            onKeyDown={(e) => handleKeyDown(e, priceRef, itemRef)} // Arrow navigation between Quantity and Item
          />
        </div>

        {/* Price Field */}
        <div className="w-28">
          <label className="block text-md font-medium leading-6 text-gray-600">
            Price Per Unit
          </label>
          <input
            ref={priceRef}
            className={`${fixedInputClass} disabled:bg-gray-200 !text-md h-9 mt-2 w-full`}
            type="number"
            name="price"
            step="any"
            placeholder="eg: 100"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            onKeyDown={(e) => handleKeyDown(e, stockInSubmit, quantityRef)} // Arrow navigation between Price and Quantity
          />
        </div>
      </div>

      {/* Stock In Button in a new row */}
      <div className="flex justify-start mt-4">
        <button
          ref={stockInSubmit}
          type="submit"
          className={`${fixedButtonClass} btn-xs sm:w-24 !h-9 w-full`}
          onKeyDown={(e) => handleKeyDown(e, submitRef, priceRef)} // Submit on Enter
        >
          {editTransaction ? "Update" : "Stock In"}
        </button>
      </div>
    </form>
  );
};

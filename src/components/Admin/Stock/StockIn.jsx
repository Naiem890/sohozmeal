import React, { useEffect, useState } from "react";
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
}) => {
  console.log(summarySelectedItem, "instockin");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  useEffect(() => {
    if (editTransaction) {
      const { item, quantity, price, date } = editTransaction.transaction;
      const summarySelectedItem = stockItems.find((i) => i.name === item);
      setSummarySelectedItem(summarySelectedItem);
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

    // Confirmation with SweetAlert2
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
        // Create the transaction object
        const transaction = {
          type: "IN",
          item: summarySelectedItem._id,
          name: summarySelectedItem.name,
          quantity,
          price,
          date,
          wing, // Include wing for clarity
        };

        // Add the transaction locally
        addTransaction(transaction);
        toast.success(
          editTransaction
            ? "Transaction updated!"
            : "Transaction added locally!"
        );

        // Reset the form
        reset();
        e.target.reset();
      }
    });
  };

  const reset = () => {
    setSummarySelectedItem(null);
    setQuantity("");
    setPrice("");
    setDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <form onSubmit={handleStockIn} className="mb-4">
      <div className="flex gap-2 flex-wrap">
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

        {/* Item Dropdown Field */}
        <div className="w-40">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Item
          </label>
          <select
            required
            value={summarySelectedItem?._id || ""}
            onChange={(e) =>
              setSummarySelectedItem(() =>
                stockItems.find((item) => item._id === e.target.value)
              )
            }
            name="unit"
            className={`${fixedInputClass} disabled:bg-gray-200 !text-xs h-9 disabled:bg-gray-200-200 mt-2 w-full`}
          >
            <option value={null}>Item</option>
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
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Quantity
          </label>
          <input
            className={`${fixedInputClass} disabled:bg-gray-200 !text-xs h-9 mt-2 w-full`}
            type="number"
            name="quantity"
            step="any"
            placeholder="eg: 10"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        {/* Price Field */}
        <div className="w-28">
          <label className="block text-sm font-medium leading-6 text-gray-600">
            Price Per Unit
          </label>
          <input
            className={`${fixedInputClass} disabled:bg-gray-200 !text-xs h-9 mt-2 w-full`}
            type="number"
            name="price"
            step="any"
            placeholder="eg: 100"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Stock In Button in a new row */}
      <div className="flex justify-start mt-4">
        <button
          type="submit"
          className={`${fixedButtonClass} btn-xs sm:w-24 !h-9 w-full`}
        >
          {editTransaction ? "Update" : "Stock In"}
        </button>
      </div>
    </form>
  );
};

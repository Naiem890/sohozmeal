import React, { useState } from "react";
import { fixedButtonClass, fixedInputClass } from "../../../Utils/constant";

export const StockOut = () => {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState("");
  return (
    <div className="grid grid-cols-3 gap-x-6 gap-y-3">
      <div className="">
        <label className="block text-sm font-medium leading-6 text-gray-600">
          Item Name
        </label>
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Type here"
          className={`${fixedInputClass} mt-2 h-10`}
        />
      </div>
      <div className="">
        <label className="block text-sm font-medium leading-6 text-gray-600">
          Quantity
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Type here"
          className={`${fixedInputClass} mt-2 h-10`}
        />
      </div>
      <div className="">
        <label className="block text-sm font-medium leading-6 text-gray-600">
          Unit
        </label>
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Type here"
          className={`${fixedInputClass} mt-2 h-10`}
        />
      </div>
      <div className="col-span-full flex justify-end">
        <button className={`${fixedButtonClass} btn-md sm:w-32`}>Update</button>
      </div>
    </div>
  );
};

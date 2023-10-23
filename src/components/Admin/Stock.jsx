import React, { useEffect, useState } from "react";
import { Axios } from "../../api/api";
import { fixedButtonClass, fixedInputClass } from "../../Utils/constant";

export const Stock = () => {
  const [stocks, setStocks] = useState([]);
  const [mode, setMode] = useState("stockIn"); // Default mode is "stockIn"
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState(0);

  useEffect(() => {
    const fetchStocks = async () => {
      const res = await Axios("/stock");
      console.log(res.data);
      setStocks(res.data);
    };
    fetchStocks();
  }, []);

  return (
    <div className="mb-10 lg:my-10 px-5 lg:mr-12">
      <h2 className="text-3xl font-semibold">Stock</h2>
      <div className="divider"></div>
      <div className="grid grid-cols-2 gap-16">
        <div className="">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Stock Summary</h2>
          </div>
          <div className="overflow-x-auto max-h-screen px-1 mt-4">
            <table className="table table-sm table-hover w-full">
              <thead className="bg-white shadow-sm sticky top-0 border-0 h-12">
                <tr className="">
                  <th className="uppercase">Name</th>
                  <th className="uppercase">Quantity</th>
                  <th>Unit</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr
                    className=" hover:shadow-sm rounded-lg hover:bg-emerald-50 transition-all border-b-0"
                    key={stock._id}
                  >
                    <td>{stock.item.name}</td>
                    <td>{stock.quantity}</td>
                    <td>{stock.item.unit}</td>
                    <td>{stock.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="mb-5 ">
            <div className="join join-vertical lg:join-horizontal ">
              <button
                onClick={() => setMode("stockIn")}
                className={`join-item ${
                  mode === "stockIn"
                    ? ""
                    : "bg-gray-200 text-neutral-600 hover:bg-gray-300"
                } ${fixedButtonClass} btn-xs h-10 !rounded-s-lg`}
              >
                Stock In
              </button>
              <button
                onClick={() => setMode("stockOut")}
                className={`join-item ${
                  mode === "stockOut"
                    ? "!bg-red-700"
                    : "bg-gray-200 text-neutral-600 hover:bg-gray-300"
                } ${fixedButtonClass} focus:ring-red-700 ml-1 btn-xs h-10 !rounded-e-lg`}
              >
                Stock Out
              </button>
            </div>
          </div>

          {mode === "stockIn" ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
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
              <div className="">
                <label className="block text-sm font-medium leading-6 text-gray-600">
                  Price
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Type here"
                  className={`${fixedInputClass} mt-2 h-10`}
                />
              </div>
              <div className="col-span-full flex justify-end">
                <button className={`${fixedButtonClass} btn-md sm:w-32`}>
                  Update
                </button>
              </div>
            </div>
          ) : (
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
                <button className={`${fixedButtonClass} btn-md sm:w-32`}>
                  Update
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

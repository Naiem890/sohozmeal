import React, { useEffect, useState } from "react";
import { Axios } from "../../../api/api";
import { fixedButtonClass, fixedInputClass } from "../../../Utils/constant";
import { StockIn } from "./StockIn";
import { StockOut } from "./StockOut";
import { StockItemsList } from "./StockItemsList";
import toast from "react-hot-toast";
import { StockSummaryTable } from "./StockSummaryTable";
import { NonStock } from "./NonStock";

const MODE = {
  STOCK_IN: "stockIn",
  STOCK_OUT: "stockOut",
  ITEMS_LIST: "items-list",
  NON_STOCK_ITEMS: "non-stock-items",
};

export const Stock = () => {
  const [stocks, setStocks] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [mode, setMode] = useState(MODE.STOCK_IN); // Default mode is "stockIn"
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [refetch, setRefetch] = useState(false);
  const [stockTransaction, setStockTransaction] = useState([]);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await Axios("/stock");
        setStocks(res.data);
      } catch (error) {
        console.error("Error while fetching stocks:", error);
        toast.error("Error retrieving stocks. Please try again.");
      }
    };

    const fetchStockItems = async () => {
      try {
        const res = await Axios("/stock/item");
        const { stockItems, units, categories } = res.data;

        setStockItems(stockItems);
        setUnits(units);
        setCategories(categories);
      } catch (error) {
        console.error("Error while fetching stock items:", error);
        toast.error("Error retrieving stock items. Please try again.");
      }
    };

    const fetchStockTransaction = async () => {
      try {
        const res = await Axios("/stock/transaction");
        setStockTransaction(res.data);
      } catch (error) {
        console.error("Error while fetching stock items:", error);
        toast.error(error.response.data.error);
      }
    };

    fetchStockItems();
    fetchStocks();
    fetchStockTransaction();
  }, [refetch]);

  const refetchHandler = () => {
    setRefetch((prev) => !prev);
  };

  const renderModeComponent = () => {
    switch (mode) {
      case MODE.STOCK_IN:
        return (
          <StockIn
            refetchHandler={refetchHandler}
            stockItems={stockItems.filter((item) => item.category === "STORED")}
          />
        );
      case MODE.STOCK_OUT:
        return <StockOut refetchHandler={refetchHandler} stocks={stocks} />;
      case MODE.ITEMS_LIST:
        return (
          <StockItemsList
            categories={categories}
            units={units}
            stockItems={stockItems}
            refetchHandler={refetchHandler}
          />
        );
      case MODE.NON_STOCK_ITEMS:
        return (
          <NonStock
            refetchHandler={refetchHandler}
            stockItems={stockItems.filter((item) => {
              return item.category === "NON_STORED";
            })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mb-10 lg:my-7 px-5 lg:mr-12">
      <h2 className="text-3xl font-semibold">Stock</h2>
      <div className="divider"></div>
      <div className="grid grid-cols-2 gap-16">
        <StockSummaryTable stocks={stocks} />
        <div>
          <div className="mb-8">
            <div className="join join-vertical lg:join-horizontal">
              <button
                onClick={() => setMode(MODE.STOCK_IN)}
                className={`join-item ${
                  mode === MODE.STOCK_IN
                    ? ""
                    : "bg-gray-400 text-neutral-600 hover:bg-gray-500"
                } ${fixedButtonClass} btn-xs !w-auto px-4 h-10 !rounded-s-xl`}
              >
                Stock In
              </button>
              <button
                onClick={() => setMode(MODE.STOCK_OUT)}
                className={`join-item ${
                  mode === MODE.STOCK_OUT
                    ? "!bg-red-700"
                    : "bg-gray-400 text-neutral-600 hover:bg-gray-500"
                } ${fixedButtonClass} btn-xs !w-auto px-4 focus:ring-red-700 ml-1 h-10`}
              >
                Stock Out
              </button>
              <button
                onClick={() => setMode(MODE.ITEMS_LIST)}
                className={`join-item ${
                  mode === MODE.ITEMS_LIST
                    ? "!bg-indigo-600"
                    : "bg-gray-400 text-neutral-600 hover:bg-gray-500"
                } ${fixedButtonClass} btn-xs !w-auto px-4 focus:ring-indigo-600 ml-1 h-10 `}
              >
                Items List
              </button>
              <button
                onClick={() => setMode(MODE.NON_STOCK_ITEMS)}
                className={`join-item ${
                  mode === MODE.NON_STOCK_ITEMS
                    ? "!bg-amber-600"
                    : "bg-gray-400 text-neutral-600 hover:bg-gray-500"
                } ${fixedButtonClass} btn-xs !w-auto px-4 focus:ring-orange-600 ml-1 h-10 !rounded-e-xl`}
              >
                Non Stock Items
              </button>
            </div>
          </div>
          {renderModeComponent()}
        </div>
      </div>
      <div className="">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Stock Transaction</h2>
        </div>
        <div className="overflow-x-auto max-h-screen px-1 mt-4">
          <table className="table table-sm w-full">
            <thead className="bg-white shadow-sm sticky top-0 border-0 h-12">
              <tr className="">
                <th className="uppercase">Name</th>
                <th className="uppercase">Quantity Change</th>
                <th className="uppercase">Type</th>
                <th className="uppercase">Meal</th>
                <th className="uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {stockTransaction.map((stock) => (
                <tr
                  className={`hover:shadow-sm rounded-lg transition-all border-b-0 ${
                    stock.type === "IN" ? "bg-green-100" : "bg-red-100"
                  }`}
                  key={stock._id}
                >
                  <td>{stock.item?.name}</td>
                  <td>
                    {stock.quantityChange} {stock.item?.unit}
                  </td>
                  <td>{stock.type}</td>
                  <td>{stock.meal}</td>
                  <td>{stock.date.split("T")[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { Axios } from "../../../api/api";
import { fixedButtonClass, fixedInputClass } from "../../../Utils/constant";
import { StockIn } from "./StockIn";
import { StockOut } from "./StockOut";
import { StockItemsList } from "./StockItemsList";
import toast from "react-hot-toast";
import { StockSummaryTable } from "./StockSummaryTable";

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

    fetchStockItems();
    fetchStocks();
  }, [refetch]);

  const refetchHandler = () => {
    setRefetch((prev) => !prev);
  };

  const renderModeComponent = () => {
    switch (mode) {
      case MODE.STOCK_IN:
        return (
          <StockIn refetchHandler={refetchHandler} stockItems={stockItems} />
        );
      case MODE.STOCK_OUT:
        return (
          <StockOut refetchHandler={refetchHandler} stockItems={stockItems} />
        );
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
        return;
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
          <div className="mb-8 ">
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
    </div>
  );
};

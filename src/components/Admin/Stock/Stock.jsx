import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { fixedButtonClass, fixedInputClass } from "../../../Utils/constant";
import { Axios } from "../../../api/api";
import { NonStock } from "./NonStock";
import { StockIn } from "./StockIn";
import { StockItemsList } from "./StockItemsList";
import { StockOut } from "./StockOut";
import { StockSummaryTable } from "./StockSummaryTable";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

const MODE = {
  STOCK_IN: "stockIn",
  STOCK_OUT: "stockOut",
  ITEMS_LIST: "items-list",
  NON_STOCK_ITEMS: "non-stock-items",
};

export const Stock = () => {
  const [stocks, setStocks] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [summarySelectedItem, setSummarySelectedItem] = useState(null);
  const [mode, setMode] = useState(MODE.STOCK_IN);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [refetch, setRefetch] = useState(false);
  const [wing, setWing] = useState("MALE");
  const [localTransactions, setLocalTransactions] = useState([]);
  const [editTransaction, setEditTransaction] = useState(null);

  // Refs for focus management
  const stockInRef = useRef(null);
  const stockOutRef = useRef(null);
  const itemsListRef = useRef(null);
  const nonStockItemsRef = useRef(null);
  const submitRef = useRef(null);

  const childRefs = {
    stockIn: useRef(null),
    stockOut: useRef(null),
    stockItems: useRef(null),
    nonStockItems: useRef(null),
  };

  const stockInSubmit = useRef(null);
  const stockOutSubmit = useRef(null);
  const stockItemsSubmit = useRef(null);
  const nonStockSubmit = useRef(null);

  useEffect(() => {
    if (wing) {
      const fetchStocks = async () => {
        try {
          const res = await Axios(`/stock?wing=${wing}`);
          setStocks(res.data);
        } catch (error) {
          console.error("Error while fetching stocks:", error);
          toast.error("Error retrieving stocks. Please try again.");
        }
      };

      const fetchStockItems = async () => {
        try {
          const res = await Axios(`/stock/item?wing=${wing}`);
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
    }
  }, [refetch, wing]);

  // Initial focus on "Stock In" button
  useEffect(() => {
    stockInRef.current?.focus();
  }, []);

  const submitRefHandler = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      if (mode === MODE.STOCK_IN) {
        stockInSubmit.current?.focus();
      } else if (mode === MODE.STOCK_OUT) {
        stockOutSubmit.current?.focus();
      } else if (mode === MODE.ITEMS_LIST) {
        stockItemsSubmit.current?.focus();
      } else if (mode === MODE.NON_STOCK_ITEMS) {
        nonStockSubmit.current?.focus();
      }
    }
  };

  // Arrow key navigation for parent and child level control
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        if (document.activeElement === stockInRef.current) {
          stockOutRef.current?.focus();
        } else if (document.activeElement === stockOutRef.current) {
          itemsListRef.current?.focus();
        } else if (document.activeElement === itemsListRef.current) {
          nonStockItemsRef.current?.focus();
        } else if (document.activeElement === nonStockItemsRef.current) {
          stockInRef.current?.focus();
        }
      } else if (e.key === "ArrowLeft") {
        if (document.activeElement === nonStockItemsRef.current) {
          itemsListRef.current?.focus();
        } else if (document.activeElement === itemsListRef.current) {
          stockOutRef.current?.focus();
        } else if (document.activeElement === stockOutRef.current) {
          stockInRef.current?.focus();
        } else if (document.activeElement === stockInRef.current) {
          nonStockItemsRef.current?.focus();
        }
      } else if (e.key === "Enter") {
        // Enter key to move from parent to first child in the section
        if (document.activeElement === stockInRef.current) {
          childRefs.stockIn.current?.focus();
        } else if (document.activeElement === stockOutRef.current) {
          childRefs.stockOut.current?.focus();
        } else if (document.activeElement === nonStockItemsRef.current) {
          childRefs.nonStockItems.current?.focus();
        } else if (document.activeElement === itemsListRef.current) {
          childRefs.stockItems.current?.focus();
        }
      } else if (e.key === "Escape") {
        // Escape key to move from child to parent
        if (childRefs.stockIn.current === document.activeElement) {
          stockInRef.current?.focus();
        } else if (childRefs.stockOut.current === document.activeElement) {
          stockOutRef.current?.focus();
        } else if (childRefs.nonStockItems.current === document.activeElement) {
          nonStockItemsRef.current?.focus();
        } else if (childRefs.stockItems.current === document.activeElement) {
          itemsListRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    childRefs.nonStockItems,
    childRefs.stockIn,
    childRefs.stockItems,
    childRefs.stockOut,
  ]);

  const addTransaction = (transaction) => {
    if (editTransaction) {
      setLocalTransactions((prevTransactions) =>
        prevTransactions.map((t, index) =>
          index === editTransaction.index ? transaction : t
        )
      );
      setEditTransaction(null);
      toast.success("Transaction updated!");
    } else {
      setLocalTransactions((prevTransactions) => [
        ...prevTransactions,
        transaction,
      ]);
      toast.success("Transaction added locally!");
    }
  };

  const handleDeleteTransaction = (index) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This transaction will be removed locally.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setLocalTransactions((prevTransactions) =>
          prevTransactions.filter((_, i) => i !== index)
        );
        toast.success("Transaction deleted locally!");
      }
    });
  };

  const handleSubmitTransactions = async () => {
    try {
      await Axios.post("/stock/transaction/batch", {
        transactions: localTransactions,
        wing,
      });
      toast.success("All transactions submitted successfully!");
      setLocalTransactions([]);
      setRefetch((prev) => !prev);
    } catch (error) {
      console.error("Error while submitting transactions:", error);
      toast.error("Error submitting transactions. Please try again.");
    }
  };

  const handleEditTransaction = (transaction, index) => {
    setEditTransaction({ transaction, index });
    if (transaction.category === "NON_STORED") {
      setMode(MODE.NON_STOCK_ITEMS);
    } else if (transaction.type === "IN") {
      setMode(MODE.STOCK_IN);
    } else if (transaction.type === "OUT") {
      setMode(MODE.STOCK_OUT);
    }
  };

  const renderModeComponent = () => {
    switch (mode) {
      case MODE.STOCK_IN:
        return (
          <StockIn
            stockItems={stockItems.filter((item) => item.category === "STORED")}
            addTransaction={addTransaction}
            wing={wing}
            editTransaction={editTransaction}
            summarySelectedItem={summarySelectedItem}
            setSummarySelectedItem={setSummarySelectedItem}
            childRef={childRefs.stockIn} // Pass the ref for Stock In child elements
            submitRef={submitRef}
            stockInSubmit={stockInSubmit}
          />
        );
      case MODE.STOCK_OUT:
        return (
          <StockOut
            stocks={stocks}
            addTransaction={addTransaction}
            wing={wing}
            editTransaction={editTransaction}
            setSummarySelectedItem={setSummarySelectedItem}
            childRef={childRefs.stockOut} // Pass the ref for Stock Out child elements
            submitRef={submitRef}
            stockOutSubmit={stockOutSubmit}
          />
        );
      case MODE.ITEMS_LIST:
        return (
          <StockItemsList
            categories={categories}
            units={units}
            stockItems={stockItems}
            refetchHandler={() => setRefetch((prev) => !prev)}
            wing={wing}
            childRef={childRefs.stockItems} // Pass the ref for Stock In child elements
            submitRef={submitRef}
            stockItemsSubmit={stockItemsSubmit}
          />
        );
      case MODE.NON_STOCK_ITEMS:
        return (
          <NonStock
            stockItems={stockItems.filter(
              (item) => item.category === "NON_STORED"
            )}
            addTransaction={addTransaction}
            wing={wing}
            editTransaction={editTransaction}
            childRef={childRefs.nonStockItems} // Pass the ref for Non Stock Items child elements
            submitRef={submitRef}
            nonStockSubmit={nonStockSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-2">
      <div className="flex justify-between">
        <h2 className="text-2xl font-semibold">Stock</h2>
        <div className="flex justify-end text-sm font-extralight">
          <select
            value={wing}
            onChange={(e) => setWing(e.target.value)}
            className={`${fixedInputClass} h-auto cursor-pointer w-44`}
          >
            <option value="">Gender</option>
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="pb-3">
            <div className="join join-vertical lg:join-horizontal">
              <button
                ref={stockInRef} // Focus reference for Stock In
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
                ref={stockOutRef} // Focus reference for Stock Out
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
                ref={itemsListRef} // Focus reference for Items List
                onClick={() => setMode(MODE.ITEMS_LIST)}
                className={`join-item ${
                  mode === MODE.ITEMS_LIST
                    ? "!bg-indigo-600"
                    : "bg-gray-400 text-neutral-600 hover:bg-gray-500"
                } ${fixedButtonClass} btn-xs !w-auto px-4 focus:ring-indigo-600 ml-1 h-10`}
              >
                Items List
              </button>
              <button
                ref={nonStockItemsRef} // Focus reference for Non Stock Items
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
        <div>
          <StockSummaryTable
            stockOutItem={
              summarySelectedItem
                ? stocks?.filter(
                    (stock) => stock?.item?._id === summarySelectedItem?._id
                  )
                : stocks
            }
          />
        </div>
      </div>

      <div className="mb-36 mt-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Transaction Summary</h2>
        </div>

        <div className="overflow-x-auto max-h-72 mt-4">
          <table className="table-fixed table table-sm w-full">
            <thead className="bg-white shadow-sm sticky top-0 border-b border-gray-200 h-9">
              <tr>
                <th className="uppercase text-left pl-3">Name</th>
                <th className="uppercase text-left pl-3">Quantity</th>
                <th className="uppercase text-left pl-3">Price</th>
                <th className="uppercase text-left pl-3">Type</th>
                <th className="uppercase text-left pl-3">Meal</th>
                <th className="uppercase text-left pl-3">Date</th>
                <th className="uppercase text-left pl-3">Actions</th>
              </tr>
            </thead>
            <tbody className="max-h-full overflow-y-auto">
              {localTransactions.map((transaction, index) => (
                <tr
                  key={index}
                  className={`hover:shadow-sm rounded-lg transition-all border-b border-gray-200 ${
                    transaction.type === "IN" ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <td className="px-4 py-2">{transaction.name}</td>
                  <td className="px-4 py-2">{transaction.quantity}</td>
                  <td className="px-4 py-2">{transaction.price || "_"}</td>
                  <td className="px-4 py-2">{transaction.type}</td>
                  <td className="px-4 py-2">{transaction.meal || "_"}</td>
                  <td className="px-4 py-2">{transaction.date}</td>
                  <td className="px-4 py-2 flex gap-4 justify-start">
                    <button
                      className="bg-blue-100 p-2 rounded-full text-blue-500 hover:text-blue-600 hover:bg-blue-200"
                      onClick={() => handleEditTransaction(transaction, index)}
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>

                    <button
                      className="bg-red-100 p-2 rounded-full text-red-500 hover:text-red-600 hover:bg-red-200"
                      onClick={() => handleDeleteTransaction(index)}
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <button
            onClick={handleSubmitTransactions}
            className={`${fixedButtonClass} btn-xs sm:w-24 !h-9 w-full`}
            ref={submitRef}
            onKeyDown={submitRefHandler}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx"; // Import xlsx for Excel file generation
import EditTransactionModal from "./EditTransactionModal";
import DateFilters from "./DateFilters";
import FilterOptions from "./FilterOptions";
import TransactionTable from "./TransactionTable";
import { message } from "daisyui";
import { Axios } from "../../../api/api";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

const TransactionHistory = () => {
  const toastId = React.useRef(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [deleteRecord, setDeleteRecord] = useState(null);

  // Date range for filtering
  const [fromDate, setFromDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
  );
  const [toDate, setToDate] = useState(new Date());

  // Filter options
  const [transactionType, setTransactionType] = useState("BOTH");
  const [mealType, setMealType] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("ASC");
  

  // Format the date to YYYY-MM-DD for API usage
  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await Axios.get(
          `stock/transactions?fromDate=${formatDate(
            fromDate
          )}&toDate=${formatDate(toDate)}`
        );
        const data = res.data;
        setTransactions(data);
        setFilteredTransactions(data); // Initialize filtered transactions
        console.log(data, "ssh");
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Error fetching transactions.");
      }
    };

    fetchTransactions();
  }, [fromDate, toDate]); // Re-fetch data when fromDate or toDate changes

  // Function to sort transactions by date
  const sortTransactionsByDate = (transactions, order) => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime(); // Convert to timestamp
      const dateB = new Date(b.date).getTime(); // Convert to timestamp
      return order === "ASC" ? dateA - dateB : dateB - dateA;
    });
  };

  // Memoize filtered transactions
  const filteredData = useMemo(() => {
    const filtered = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const withinDateRange =
        transactionDate >= fromDate && transactionDate <= toDate;
      const typeMatch =
        transactionType === "BOTH" ||
        (transactionType === "IN" && transaction.type === "IN") ||
        (transactionType === "OUT" && transaction.type === "OUT");
      const mealMatch = mealType === "ALL" || transaction.meal === mealType;
      return withinDateRange && typeMatch && mealMatch;
    });

    return sortTransactionsByDate(filtered, sortOrder);
  }, [transactions, fromDate, toDate, transactionType, mealType, sortOrder]);

  useEffect(() => {
    setFilteredTransactions(filteredData);
  }, [filteredData]);

  const toggleTransactionType = () => {
    setTransactionType((prevType) =>
      prevType === "BOTH" ? "IN" : prevType === "IN" ? "OUT" : "BOTH"
    );
  };

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === "ASC" ? "DESC" : "ASC"));
  };

  const showEditModal = (record) => {
    setEditingRecord(record);
    setIsModalVisible(true);
  };

  // Show delete confirmation toast
  const showDeleteConfirmation = (record) => {
    toastId.current = toast(
      <div>
        <p>Are you sure you want to delete this transaction?</p>
        <p>
          <strong>Item:</strong> {record?.item?.name}
        </p>
        <p>
          <strong>Quantity:</strong> {record?.quantityChange}
        </p>
        <p>
          <strong>Amount:</strong> {record?.transactionAmount?.toFixed(2)} ৳
        </p>
        <div className="flex justify-end gap-2 mt-3">
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
            onClick={() => {
              confirmDelete(record._id);
              toast.dismiss(toastId.current);
            }}
          >
            Confirm
          </button>
          <button
            className="bg-gray-300 hover:bg-gray-400 px-4 py-1 rounded"
            onClick={() => toast.dismiss(toastId.current)}
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        hideProgressBar: true,
      }
    );
  };

  // Confirm delete handler
  const confirmDelete = (recordId) => {
    const updatedData = transactions.filter((item) => item._id !== recordId);
    setTransactions(updatedData);
  };

  // Flatten data to exclude _id and include item fields
  // Flatten data to exclude _id and include item fields, adding Unit Price column
  const flattenData = (data) => {
    return data.map((transaction) => ({
      Date: new Date(transaction.date).toLocaleDateString("en-GB"),
      "Item Name": transaction.item.name,
      quantity: transaction.quantityChange,
      Unit: transaction.item.unit,
      "Unit Price": (
        transaction.transactionAmount / transaction.quantityChange
      ).toFixed(2),
      "Total Amount": transaction.transactionAmount.toFixed(2),
      Meal: transaction.meal,
      Type: transaction.type,
      Category: transaction.category || "",
    }));
  };

  // Function to export data to Excel
  const exportToExcel = () => {
    const flattenedData = flattenData(filteredTransactions);
    const ws = XLSX.utils.json_to_sheet(flattenedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    // Get the current date and time
    const currentDate = new Date();
    const datePart = currentDate
      .toLocaleDateString("en-GB")
      .replace(/\//g, "-"); // Format date as dd-mm-yyyy
    const timePart = currentDate
      .toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace(/:/g, "-"); // Format time as HH-MM-SS

    // Create the file name
    const fileName = `${datePart}_${timePart}_transaction-history.xlsx`;

    // Write the Excel file
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="lg:my-10 mb-10 px-5 lg:mr-12">
      <div className="flex justify-between gap-2 h-auto ">
        <h2 className="text-lg self-center xs:text-3xl font-semibold">
          Transaction History
        </h2>
        <div className="flex justify-center items-center gap-2">
          <DateFilters
            fromDate={fromDate}
            toDate={toDate}
            setFromDate={setFromDate}
            setToDate={setToDate}
          />
          <button
            className="bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 px-2 py-2 font-thin flex items-center gap-2 hover:ring-1 ring-offset-2 ring-emerald-500 transition-all duration-300"
            onClick={exportToExcel}
            style={{
              fontSize: "0.7rem",
            }}
          >
            <ArrowDownTrayIcon style={{ height: "22px", width: "22px" }} />
          </button>
        </div>
      </div>

      <div className="divider"></div>
      <FilterOptions
        transactionType={transactionType}
        mealType={mealType}
        toggleTransactionType={toggleTransactionType}
        setMealType={setMealType}
      />
      <TransactionTable
        transactions={filteredTransactions}
        sortOrder={sortOrder}
        toggleSortOrder={toggleSortOrder}
        showEditModal={showEditModal}
        handleDelete={showDeleteConfirmation} // Change delete handler to show toast
      />
      {editingRecord && (
        <EditTransactionModal
          visible={isModalVisible}
          record={editingRecord}
          handleSave={(values) => {
            const updatedTransactions = transactions.map((transaction) =>
              transaction._id === editingRecord._id
                ? { ...transaction, ...values }
                : transaction
            );
            setTransactions(updatedTransactions);
            setIsModalVisible(false);
            message.success("Transaction updated successfully");
          }}
          handleCancel={() => setIsModalVisible(false)}
        />
      )}

      <ToastContainer />
    </div>
  );
};

export default TransactionHistory;

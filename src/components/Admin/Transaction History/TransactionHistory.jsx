import React, { useState, useMemo, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx"; // Import xlsx for Excel file generation
import EditTransactionModal from "./EditTransactionModal";
import DateFilters from "./DateFilters";
import FilterOptions from "./FilterOptions";
import TransactionTable from "./TransactionTable";
import { Axios } from "../../../api/api";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { fixedInputClass } from "../../../Utils/constant";
import { useAuthUser } from "react-auth-kit";

const TransactionHistory = () => {
  const auth = useAuthUser()();
  const toastId = React.useRef(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  // Date range for filtering
  const [fromDate, setFromDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
  );
  const [toDate, setToDate] = useState(new Date());

  // Wing selection (MALE/FEMALE)
  const [selectedWing, setSelectedWing] = useState(auth.wing);

  // Filter options
  const [transactionType, setTransactionType] = useState("BOTH");
  const [mealType, setMealType] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("DESC");

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
          )}&toDate=${formatDate(toDate)}&wing=${selectedWing}`
        );
        const data = res.data;
        setTransactions(data);
        setFilteredTransactions(data); // Initialize filtered transactions
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Error fetching transactions.");
      }
    };

    fetchTransactions();
  }, [fromDate, toDate, selectedWing]); // Re-fetch data when fromDate, toDate, or selectedWing changes

  // Function to sort transactions by date
  const sortTransactionsByDate = (transactions, order) => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime(); // Convert to timestamp
      const dateB = new Date(b.createdAt).getTime(); // Convert to timestamp
      return order === "ASC" ? dateA - dateB : dateB - dateA;
    });
  };

  // Memoize filtered transactions
  const filteredData = useMemo(() => {
    const filtered = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.createdAt);
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
  const confirmDelete = async (recordId) => {
    try {
      await Axios.delete(`/stock/transaction/${recordId}`);

      // Remove the deleted record from the transactions array
      const updatedData = transactions.filter((item) => item._id !== recordId);
      setTransactions(updatedData);

      toast.success("Transaction deleted successfully");
    } catch (error) {
      console.error("Error deleting transaction:", error.response.data.error);
      toast.error(error.response.data.error);
    }
  };

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

  const handleUpdateSave = async (updatedRecord) => {
    try {
      // Call the API to update the transaction
      const res = await Axios.put(
        `/stock/transaction/${updatedRecord._id}`,
        updatedRecord
      );
      const updatedTransaction = res.data.updatedTransaction;

      // Update the transactions in the state with the new updated transaction
      const updatedTransactions = transactions.map((transaction) =>
        transaction._id === updatedTransaction._id
          ? updatedTransaction
          : transaction
      );
      setTransactions(updatedTransactions);

      // Close the modal and show success message
      setIsModalVisible(false);
      toast.success("Transaction updated successfully");
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction.");
    }
  };

  const handleSync = async () => {
    try {
      const year = toDate.getFullYear();
      const month = Number(toDate.getMonth()) + 1;
      const wing = selectedWing;

      // Send the query parameters along with the POST request
      const res = await Axios.post(
        `/cost/sync?year=${year}&month=${month}&wing=${wing}`
      );

      toast.success("Sync Successful");
      console.log(res, "kk");
    } catch (e) {
      console.log(e);
      toast.error("Something error occurred!");
    }
  };

  return (
    <div className="mt-2">
      <div className="flex justify-between gap-2 h-auto ">
        <h2 className="text-lg self-center xs:text-2xl font-semibold">
          Transaction History
        </h2>
        <div className="flex justify-center items-center gap-2">
          <button
            className="btn btn-sm bg-emerald-500 rounded-md text-white font-extralight hover:bg-emerald-600"
            onClick={handleSync}
          >
            Sync
          </button>
          <DateFilters
            fromDate={fromDate}
            toDate={toDate}
            setFromDate={setFromDate}
            setToDate={setToDate}
          />
          {auth.wing === "ALL" && (
            <div className="relative">
              <select
                value={selectedWing}
                onChange={(e) => setSelectedWing(e.target.value)}
                className={`${fixedInputClass} h-auto cursor-pointer w-44`}
              >
                <option value="">Gender</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
              </select>
            </div>
          )}
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
          handleSave={handleUpdateSave}
          handleCancel={() => setIsModalVisible(false)}
        />
      )}

      <ToastContainer />
    </div>
  );
};

export default TransactionHistory;

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import EditTransactionModal from "./EditTransactionModal";
import DateFilters from "./DateFilters";
import FilterOptions from "./FilterOptions";
import TransactionTable from "./TransactionTable";
import { Axios } from "../../../api/api";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthUser } from "react-auth-kit";

const TransactionHistory = () => {
  const auth = useAuthUser()();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord,   setEditingRecord]  = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [pagination,   setPagination]   = useState({ page: 1, totalPages: 1, total: 0 });
  const [page,         setPage]         = useState(1);
  const [pageSize,     setPageSize]     = useState(20);

  const [fromDate, setFromDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
  );
  const [toDate, setToDate] = useState(new Date());

  const [selectedWing,     setSelectedWing]     = useState(auth.wing === "ALL" ? "MALE" : auth.wing);
  const [transactionType,  setTransactionType]  = useState("BOTH");
  const [mealType,         setMealType]         = useState("ALL");
  const [sortOrder,        setSortOrder]        = useState("DESC");

  const formatDate = (date) => date.toISOString().split("T")[0];

  const fetchTransactions = useCallback(async (pg) => {
    const toastId = toast.loading("Fetching transactions...");
    try {
      const params = new URLSearchParams({
        fromDate:  formatDate(fromDate),
        toDate:    formatDate(toDate),
        wing:      selectedWing,
        sortOrder,
        page:      pg,
        limit:     pageSize,
      });
      if (transactionType !== "BOTH") params.set("type", transactionType);
      if (mealType        !== "ALL")  params.set("meal", mealType);

      const res = await Axios.get(`stock/transactions?${params}`);
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
      toast.success("Transactions fetched successfully!", { id: toastId });
    } catch {
      toast.error("Error fetching transactions.", { id: toastId });
    }
  }, [fromDate, toDate, selectedWing, transactionType, mealType, sortOrder, pageSize]);

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setPage(1);
  }, [fromDate, toDate, selectedWing, transactionType, mealType, sortOrder, pageSize]);

  useEffect(() => {
    fetchTransactions(page);
  }, [page, fetchTransactions]);

  const toggleTransactionType = () => {
    setTransactionType((prev) =>
      prev === "BOTH" ? "IN" : prev === "IN" ? "OUT" : "BOTH"
    );
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
  };

  const showEditModal = (record) => {
    setEditingRecord(record);
    setIsModalVisible(true);
  };

  const showDeleteConfirmation = (record) => {
    toast.warning("Delete this transaction?", {
      description: `${record?.item?.name}  ·  qty ${record?.quantityChange}  ·  ${record?.transactionAmount?.toFixed(2)} ৳`,
      duration: Infinity,
      action: {
        label: "Delete",
        onClick: () => confirmDelete(record._id),
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  const confirmDelete = async (recordId) => {
    try {
      await Axios.delete(`/stock/transaction/${recordId}`);
      fetchTransactions(page);
      toast.success("Transaction deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error deleting transaction");
    }
  };

  const exportToExcel = async () => {
    const toastId = toast.loading("Preparing export...");
    try {
      // Fetch all data (no page/limit) for export
      const params = new URLSearchParams({
        fromDate:  formatDate(fromDate),
        toDate:    formatDate(toDate),
        wing:      selectedWing,
        sortOrder,
        limit:     10000,
        page:      1,
      });
      if (transactionType !== "BOTH") params.set("type", transactionType);
      if (mealType        !== "ALL")  params.set("meal", mealType);

      const res  = await Axios.get(`stock/transactions?${params}`);
      const data = res.data.transactions.map((t) => ({
        Date:           new Date(t.date).toLocaleDateString("en-GB"),
        "Item Name":    t.item.name,
        quantity:       t.quantityChange,
        Unit:           t.item.unit,
        "Unit Price":   (t.transactionAmount / t.quantityChange).toFixed(2),
        "Total Amount": t.transactionAmount.toFixed(2),
        Meal:           t.meal,
        Type:           t.type,
        Category:       t.category || "",
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");
      const datePart = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
      XLSX.writeFile(wb, `${datePart}_transaction-history.xlsx`);
      toast.success("Export ready", { id: toastId });
    } catch {
      toast.error("Error exporting Excel file", { id: toastId });
    }
  };

  const handleUpdateSave = async (updatedRecord) => {
    try {
      const res = await Axios.put(`/stock/transaction/${updatedRecord._id}`, updatedRecord);
      const updated = res.data.updatedTransaction;
      setTransactions((prev) =>
        prev.map((t) => (t._id === updated._id ? updated : t))
      );
      setIsModalVisible(false);
      toast.success("Transaction updated successfully");
    } catch {
      toast.error("Failed to update transaction.");
    }
  };

  const handleSync = async () => {
    const toastId = toast.loading("Syncing...");
    try {
      const year  = toDate.getFullYear();
      const month = Number(toDate.getMonth()) + 1;
      await Axios.post(`/cost/sync?year=${year}&month=${month}&wing=${selectedWing}`);
      toast.success("Sync successful!", { id: toastId });
    } catch {
      toast.error("Sync failed!", { id: toastId });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Transaction History</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={handleSync}>Sync</Button>
          <DateFilters fromDate={fromDate} toDate={toDate} setFromDate={setFromDate} setToDate={setToDate} />
          {auth.wing === "ALL" && (
            <Select value={selectedWing} onValueChange={setSelectedWing}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button size="icon" variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <FilterOptions
        transactionType={transactionType}
        mealType={mealType}
        toggleTransactionType={toggleTransactionType}
        setMealType={setMealType}
      />

      <TransactionTable
        transactions={transactions}
        sortOrder={sortOrder}
        toggleSortOrder={toggleSortOrder}
        showEditModal={showEditModal}
        handleDelete={showDeleteConfirmation}
        pagination={pagination}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />

      {editingRecord && (
        <EditTransactionModal
          visible={isModalVisible}
          record={editingRecord}
          handleSave={handleUpdateSave}
          handleCancel={() => setIsModalVisible(false)}
        />
      )}
    </div>
  );
};

export default TransactionHistory;

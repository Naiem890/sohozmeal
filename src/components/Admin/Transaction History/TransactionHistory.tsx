import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import EditTransactionModal from "./EditTransactionModal";
import DateFilters from "./DateFilters";
import FilterOptions from "./FilterOptions";
import TransactionTable from "./TransactionTable";
import BulkActionBar from "./BulkActionBar";
import { Axios } from "../../../api/api";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthUser } from "react-auth-kit";

interface AuthUser {
  wing: string;
  [key: string]: unknown;
}

interface Transaction {
  _id: string;
  type: string;
  quantityChange: number;
  transactionAmount?: number;
  item?: { name?: string; unit?: string; category?: string };
  meal?: string;
  date?: string;
  createdAt?: string;
  category?: string;
  [key: string]: unknown;
}

interface StockInfo {
  available: number;
  unit?: string;
}

const TransactionHistory = () => {
  const auth = useAuthUser()() as AuthUser;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord,   setEditingRecord]  = useState<Transaction | null>(null);
  const [editStockInfo,   setEditStockInfo]  = useState<StockInfo | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Clear selection when data changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [transactions]);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const fetchTransactions = useCallback(async (pg: number) => {
    const toastId = toast.loading("Fetching transactions...");
    try {
      const params = new URLSearchParams({
        fromDate:  formatDate(fromDate),
        toDate:    formatDate(toDate),
        wing:      selectedWing,
        sortOrder,
        page:      String(pg),
        limit:     String(pageSize),
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

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t._id)));
    }
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    toast.warning(`Delete ${count} transaction${count > 1 ? "s" : ""}?`, {
      description: "This action cannot be undone. Bills will be recalculated.",
      duration: Infinity,
      action: {
        label: "Delete All",
        onClick: () => confirmBulkDelete(),
      },
      cancel: { label: "Cancel" } as unknown as { label: string; onClick: () => void },
    });
  };

  const confirmBulkDelete = async () => {
    const toastId = toast.loading(`Deleting ${selectedIds.size} transactions...`);
    try {
      await Axios.post("/stock/transactions/bulk-delete", { ids: Array.from(selectedIds) });
      toast.success(`${selectedIds.size} transactions deleted`, { id: toastId });
      setSelectedIds(new Set());
      fetchTransactions(page);
    } catch (error) {
      const e = error as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || "Error deleting transactions", { id: toastId });
    }
  };

  const showEditModal = async (record: Transaction) => {
    setEditingRecord(record);
    setEditStockInfo(null);

    if (record.item?.category === "STORED" || (!record.item?.category && record.type !== "NON_STORED")) {
      try {
        const res = await Axios.get(`/stock?wing=${selectedWing}`);
        const stocks = res.data as Array<{ item?: { _id?: string; name?: string; unit?: string }; quantity?: number }>;
        const itemStock = stocks.find((s) => s.item?.name === record.item?.name);
        if (itemStock) {
          setEditStockInfo({ available: itemStock.quantity ?? 0, unit: itemStock.item?.unit });
        }
      } catch {
        // Non-critical
      }
    }

    setIsModalVisible(true);
  };

  const showDeleteConfirmation = (record: Transaction) => {
    toast.warning("Delete this transaction?", {
      description: `${record?.item?.name}  ·  qty ${record?.quantityChange}  ·  ${record?.transactionAmount?.toFixed(2)} ৳`,
      duration: Infinity,
      action: {
        label: "Delete",
        onClick: () => confirmDelete(record._id),
      },
      cancel: { label: "Cancel" } as unknown as { label: string; onClick: () => void },
    });
  };

  const confirmDelete = async (recordId: string) => {
    try {
      await Axios.delete(`/stock/transaction/${recordId}`);
      fetchTransactions(page);
      toast.success("Transaction deleted successfully");
    } catch (error) {
      const e = error as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || "Error deleting transaction");
    }
  };

  const exportToExcel = async () => {
    const toastId = toast.loading("Preparing export...");
    try {
      const params = new URLSearchParams({
        fromDate:  formatDate(fromDate),
        toDate:    formatDate(toDate),
        wing:      selectedWing,
        sortOrder,
        limit:     "10000",
        page:      "1",
      });
      if (transactionType !== "BOTH") params.set("type", transactionType);
      if (mealType        !== "ALL")  params.set("meal", mealType);

      const res  = await Axios.get(`stock/transactions?${params}`);
      const data = res.data.transactions.map((t: Transaction) => ({
        Date:           new Date(t.date as string).toLocaleDateString("en-GB"),
        "Item Name":    t.item?.name ?? "",
        quantity:       t.quantityChange,
        Unit:           t.item?.unit ?? "",
        "Unit Price":   ((t.transactionAmount ?? 0) / (t.quantityChange || 1)).toFixed(2),
        "Total Amount": (t.transactionAmount ?? 0).toFixed(2),
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

  const handleUpdateSave = async (updatedRecord: Transaction) => {
    try {
      const res = await Axios.put(`/stock/transaction/${updatedRecord._id}`, updatedRecord);
      const serverData = res.data.updatedTransaction as Transaction;
      // Backend returns the raw document (item is unpopulated ObjectId).
      // Preserve the populated item from the local record so the row renders immediately.
      const merged: Transaction = { ...serverData, item: updatedRecord.item };
      setTransactions((prev) =>
        prev.map((t) => (t._id === merged._id ? merged : t))
      );
      setIsModalVisible(false);
      toast.success("Transaction updated successfully");
    } catch (error) {
      const e = error as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || "Failed to update transaction.");
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

      <BulkActionBar
        selectedCount={selectedIds.size}
        totalCount={transactions.length}
        onSelectAll={handleSelectAll}
        onBulkDelete={handleBulkDelete}
        onClearSelection={() => setSelectedIds(new Set())}
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
        onPageSizeChange={(size: number) => { setPageSize(size); setPage(1); }}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
      />

      {editingRecord && (
        <EditTransactionModal
          visible={isModalVisible}
          record={editingRecord}
          handleSave={handleUpdateSave}
          handleCancel={() => setIsModalVisible(false)}
          stockInfo={editStockInfo}
        />
      )}
    </div>
  );
};

export default TransactionHistory;

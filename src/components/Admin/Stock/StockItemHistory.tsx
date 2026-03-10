import React, { useEffect, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Loader2, PackageSearch } from "lucide-react";
import { Axios } from "../../../api/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const MEAL_COLORS: Record<string, string> = {
  BREAKFAST: "bg-amber-50 text-amber-700 ring-amber-200",
  LUNCH:     "bg-sky-50 text-sky-700 ring-sky-200",
  DINNER:    "bg-indigo-50 text-indigo-700 ring-indigo-200",
};

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "IN",  label: "Stock In" },
  { key: "OUT", label: "Stock Out" },
];

function formatDate(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

interface StockTransaction {
  _id: string;
  type: string;
  quantityChange: number;
  transactionAmount?: number;
  unitPrice?: number;
  date: string;
  meal?: string;
  item?: { name?: string; unit?: string };
  balance?: number;
  [key: string]: unknown;
}

interface StockItemHistoryItem {
  _id: string;
  name?: string;
  unit?: string;
  category?: string;
  [key: string]: unknown;
}

interface StockItemHistoryProps {
  item: StockItemHistoryItem | null;
  wing: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function withRunningBalance(transactions: StockTransaction[]) {
  let balance = 0;
  return transactions.map((t) => {
    balance += t.type === "IN" ? t.quantityChange : -t.quantityChange;
    return { ...t, balance };
  });
}

export const StockItemHistory = ({ item, wing, open, onOpenChange }: StockItemHistoryProps) => {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (!open || !item) return;
    setFilter("ALL");
    setLoading(true);
    Axios.get(`/stock/transactions/all?wing=${wing}&item=${item._id}`)
      .then((res) => setTransactions(res.data))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, [open, item, wing]);

  // Always compute running balance on the full set so the balance pill stays accurate
  const allWithBalance = transactions.length > 0 ? withRunningBalance(transactions) : [];

  const visible = filter === "ALL"
    ? allWithBalance
    : allWithBalance.filter((t: StockTransaction) => t.type === filter);

  const totalIn    = transactions.filter((t) => t.type === "IN").reduce((s, t) => s + t.quantityChange, 0);
  const totalOut   = transactions.filter((t) => t.type === "OUT").reduce((s, t) => s + t.quantityChange, 0);
  const totalSpent = transactions.reduce((s, t) => s + (t.transactionAmount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <PackageSearch className="h-4 w-4 text-muted-foreground" />
            {item?.name}
            <span className="text-xs font-normal text-muted-foreground">
              ({item?.unit}) — {item?.category}
            </span>
          </DialogTitle>

          {!loading && transactions.length > 0 && (
            <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">
                ↑ Total In: {totalIn.toFixed(2)} {item?.unit}
              </span>
              <span className="text-red-500 font-medium">
                ↓ Total Out: {totalOut.toFixed(2)} {item?.unit}
              </span>
              <span className="font-medium">
                ৳ Total Spent: {totalSpent.toFixed(2)}
              </span>
            </div>
          )}

          {/* Filter buttons */}
          {!loading && transactions.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                    filter === key
                      ? key === "IN"
                        ? "bg-green-100 text-green-700 border-green-300"
                        : key === "OUT"
                        ? "bg-red-100 text-red-600 border-red-300"
                        : "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {label}
                  <span className="ml-1.5 opacity-60 tabular-nums">
                    ({key === "ALL"
                      ? transactions.length
                      : transactions.filter((t) => t.type === key).length})
                  </span>
                </button>
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading history...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <PackageSearch className="h-8 w-8 opacity-30" />
              <span className="text-sm">No transactions found for this item.</span>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <PackageSearch className="h-8 w-8 opacity-30" />
              <span className="text-sm">No {filter === "IN" ? "stock in" : "stock out"} transactions found.</span>
            </div>
          ) : (
            <ol className="relative border-l border-border ml-3">
              {visible.map((t) => {
                const isIN = t.type === "IN";
                return (
                  <li key={t._id} className="mb-0 ml-6 pb-6 last:pb-0">
                    {/* Timeline dot */}
                    <span
                      className={cn(
                        "absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-background",
                        isIN ? "bg-green-100" : "bg-red-100"
                      )}
                    >
                      {isIN ? (
                        <ArrowDownCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4 text-red-500" />
                      )}
                    </span>

                    {/* Card */}
                    <div
                      className={cn(
                        "rounded-lg border p-3 text-sm shadow-sm",
                        isIN
                          ? "border-green-100 bg-green-50/40"
                          : "border-red-100 bg-red-50/30"
                      )}
                    >
                      {/* Row 1: type + date + meal + balance */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ring-1",
                              isIN
                                ? "bg-green-100 text-green-700 ring-green-300"
                                : "bg-red-100 text-red-600 ring-red-300"
                            )}
                          >
                            {isIN ? "IN" : "OUT"}
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatDate(t.date)}
                          </span>
                          {t.meal && t.meal !== "-" && (
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
                                MEAL_COLORS[t.meal] || "bg-muted text-muted-foreground ring-border"
                              )}
                            >
                              {t.meal.charAt(0) + t.meal.slice(1).toLowerCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                          Balance: {t.balance.toFixed(2)} {t.item?.unit || item?.unit}
                        </span>
                      </div>

                      {/* Row 2: qty + unit price + total */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-foreground/80">
                        <span>
                          <span className="text-muted-foreground">Qty: </span>
                          <span className="font-semibold tabular-nums">
                            {isIN ? "+" : "−"}{t.quantityChange.toFixed(2)} {t.item?.unit || item?.unit}
                          </span>
                        </span>
                        {t.unitPrice != null && (
                          <span>
                            <span className="text-muted-foreground">Unit: </span>
                            <span className="tabular-nums">৳{t.unitPrice?.toFixed(2)}</span>
                          </span>
                        )}
                        {t.transactionAmount != null && (
                          <span>
                            <span className="text-muted-foreground">Total: </span>
                            <span className="font-semibold tabular-nums">৳{t.transactionAmount?.toFixed(2)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Axios } from "../../../api/api";
import { StockItemsList } from "./StockItemsList";
import { StockSummaryTable } from "./StockSummaryTable";
import { StockItemHistory } from "./StockItemHistory";
import { StockIn } from "./StockIn";
import { StockOut } from "./StockOut";
import { NonStock } from "./NonStock";
import { Keyboard, Send, Trash2 } from "lucide-react";
import { useAuthUser } from "react-auth-kit";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AuthUser {
  wing: string;
  [key: string]: unknown;
}

interface StockItem {
  _id: string;
  name: string;
  unit: string;
  category: string;
  [key: string]: unknown;
}

interface StockEntry {
  _id: string;
  item?: { _id?: string; name?: string; unit?: string };
  quantity?: number;
  [key: string]: unknown;
}

interface Transaction {
  id: string;
  type: string;
  item: string;
  name: string;
  quantity: number;
  price?: number;
  meal?: string;
  date: string;
  category?: string;
  wing: string;
}

let rowCounter = 0;
const newId = () => `row-${++rowCounter}`;

const TABS = [
  { key: "stockIn",  label: "Stock In" },
  { key: "stockOut", label: "Stock Out" },
  { key: "nonStock", label: "Non-Stock" },
  { key: "items",    label: "Items" },
];

// ─── Keyboard shortcut guide ──────────────────────────────────────────────────

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground leading-none">
    {children}
  </kbd>
);

const SHORTCUT_GROUPS = [
  {
    title: "Tab Switching",
    items: [
      { keys: ["Alt", "1"], desc: "Stock In" },
      { keys: ["Alt", "2"], desc: "Stock Out" },
      { keys: ["Alt", "3"], desc: "Non-Stock" },
      { keys: ["Alt", "4"], desc: "Items" },
    ],
  },
  {
    title: "Field Navigation",
    items: [
      { keys: ["Tab"], desc: "Next field" },
      { keys: ["Shift", "Tab"], desc: "Previous field" },
      { keys: ["→", "↓"], desc: "Next field (arrow)" },
      { keys: ["←", "↑"], desc: "Prev field (arrow)" },
    ],
  },
  {
    title: "Item Search",
    items: [
      { keys: ["↑", "↓"], desc: "Navigate dropdown" },
      { keys: ["Enter"], desc: "Select highlighted" },
      { keys: ["Esc"], desc: "Close dropdown" },
      { keys: ["type"], desc: "Filter items" },
    ],
  },
  {
    title: "Transactions",
    items: [
      { keys: ["Enter"], desc: "Add to pending list" },
      { keys: ["Ctrl", "↵"], desc: "Submit all pending" },
      { keys: ["?"], desc: "Toggle this guide" },
    ],
  },
];

const KeyboardGuide = () => (
  <div className="rounded-lg border bg-muted/20 p-3.5">
    <p className="text-xs font-semibold flex items-center gap-1.5 mb-3 text-muted-foreground">
      <Keyboard className="h-3.5 w-3.5" />
      Keyboard Shortcuts
    </p>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {SHORTCUT_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-2">
            {group.title}
          </p>
          <div className="space-y-1.5">
            {group.items.map(({ keys, desc }) => (
              <div key={desc} className="flex items-center gap-1.5 text-xs">
                <span className="flex gap-0.5 shrink-0">
                  {keys.map((k) => <Kbd key={k}>{k}</Kbd>)}
                </span>
                <span className="text-muted-foreground truncate">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const Stock = () => {
  const auth = useAuthUser()() as AuthUser;
  const [stocks, setStocks] = useState<StockEntry[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [refetch, setRefetch] = useState(false);
  const [wing, setWing] = useState(auth.wing === "ALL" ? "MALE" : auth.wing);
  const [tab, setTab] = useState("stockIn");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summarySelectedItem, setSummarySelectedItem] = useState<StockItem | null>(null);
  const [editTransaction, setEditTransaction] = useState<{ transaction: Record<string, unknown> } | null>(null);
  const [summarySearch, setSummarySearch] = useState("");
  const [showGuide, setShowGuide] = useState(true);
  const [historyItem, setHistoryItem] = useState<StockItem | null>(null);

  const submitRef     = useRef<HTMLButtonElement | null>(null);
  const childRef      = useRef<HTMLButtonElement | null>(null);
  const stockInSubmit  = useRef<HTMLButtonElement | null>(null);
  const stockOutSubmit = useRef<HTMLButtonElement | null>(null);
  const nonStockSubmit = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!wing) return;
    const fetchStocks = async () => {
      try {
        const res = await Axios(`/stock?wing=${wing}`);
        setStocks(res.data);
      } catch {
        toast.error("Error retrieving stocks.");
      }
    };
    const fetchStockItems = async () => {
      try {
        const res = await Axios(`/stock/item?wing=${wing}`);
        const { stockItems, units, categories } = res.data;
        setStockItems(stockItems);
        setUnits(units);
        setCategories(categories);
      } catch {
        toast.error("Error retrieving stock items.");
      }
    };
    fetchStockItems();
    fetchStocks();
  }, [refetch, wing]);

  const addTransaction = (transaction: object) => {
    setTransactions((prev) => [...prev, { ...(transaction as Omit<Transaction, "id">), id: newId() }]);
  };

  const removeTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSubmit = useCallback(async () => {
    if (transactions.length === 0) {
      toast.error("No transactions to submit.");
      return;
    }

    // Pre-validate: check cumulative OUT quantities don't exceed available stock
    const outByItem = new Map<string, { total: number; name: string }>();
    for (const t of transactions) {
      if (t.type === "OUT" && t.category !== "NON_STORED") {
        const existing = outByItem.get(t.name) || { total: 0, name: t.name };
        existing.total += t.quantity;
        outByItem.set(t.name, existing);
      }
    }

    // Account for pending IN transactions that increase stock
    const inByName = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === "IN") {
        inByName.set(t.name, (inByName.get(t.name) || 0) + t.quantity);
      }
    }

    for (const [itemName, { total }] of outByItem) {
      const stockEntry = stocks.find((s) => s.item?.name === itemName);
      const currentAvailable = stockEntry?.quantity ?? 0;
      const pendingIn = inByName.get(itemName) ?? 0;
      const effectiveAvailable = currentAvailable + pendingIn;

      if (total > effectiveAvailable) {
        toast.error(
          `Insufficient stock for "${itemName}". Available: ${currentAvailable}${pendingIn > 0 ? ` + ${pendingIn} pending IN` : ""}, total OUT: ${total}`
        );
        return;
      }
    }

    try {
      const request = Axios.post("/stock/transaction/batch", { transactions, wing });
      toast.promise(request, {
        loading: `Submitting ${transactions.length} transaction(s)...`,
        success: `${transactions.length} transaction(s) saved!`,
        error: (err: { response?: { data?: { error?: string } } }) =>
          err?.response?.data?.error || "Error submitting transactions.",
      });
      await request;
      setTransactions([]);
      setRefetch((p) => !p);
    } catch {
      // toast.promise already handles error display
    }
  }, [transactions, wing, stocks]);

  // Global keyboard shortcuts
  useEffect(() => {
    const tabKeys = ["stockIn", "stockOut", "nonStock", "items"];
    const handler = (e: KeyboardEvent) => {
      const inInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName ?? ""
      );

      // Alt+1–4: switch tabs
      if (e.altKey && e.key >= "1" && e.key <= "4") {
        e.preventDefault();
        setTab(tabKeys[parseInt(e.key) - 1] ?? "stockIn");
        return;
      }
      // Ctrl+Enter: submit pending
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
        return;
      }
      // ?: toggle guide (not when typing)
      if (e.key === "?" && !inInput) {
        setShowGuide((g) => !g);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleSubmit]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Stock</h2>
        <div className="flex items-center gap-2">
          {auth.wing === "ALL" && (
            <Select value={wing} onValueChange={setWing}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGuide((g) => !g)}
            className={cn(
              "gap-1.5 text-xs text-muted-foreground",
              showGuide && "bg-muted text-foreground"
            )}
          >
            <Keyboard className="h-3.5 w-3.5" />
            Shortcuts
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b">
        {TABS.map(({ key, label }, i) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5",
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            <span className="text-[9px] opacity-30 font-mono">Alt+{i + 1}</span>
          </button>
        ))}
      </div>

      {tab !== "items" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
          {/* Left: form + pending + guide */}
          <div className="xl:col-span-2 space-y-4">
            {tab === "stockIn" && (
              <StockIn
                stockItems={stockItems}
                addTransaction={addTransaction}
                wing={wing}
                editTransaction={editTransaction as null}
                summarySelectedItem={summarySelectedItem}
                setSummarySelectedItem={(item) => setSummarySelectedItem(item as StockItem | null)}
                childRef={childRef}
                submitRef={submitRef}
                stockInSubmit={stockInSubmit}
              />
            )}
            {tab === "stockOut" && (
              <StockOut
                stocks={stocks}
                addTransaction={addTransaction}
                wing={wing}
                editTransaction={editTransaction as null}
                setSummarySelectedItem={(item) => setSummarySelectedItem(item as StockItem | null)}
                childRef={childRef}
                submitRef={submitRef}
                stockOutSubmit={stockOutSubmit}
                pendingTransactions={transactions}
              />
            )}
            {tab === "nonStock" && (
              <NonStock
                stockItems={stockItems.filter((i) => i.category === "NON_STORED")}
                addTransaction={addTransaction}
                wing={wing}
                editTransaction={editTransaction as null}
                childRef={childRef}
                submitRef={submitRef}
                nonStockSubmit={nonStockSubmit}
              />
            )}

            {/* Pending transactions */}
            {transactions.length > 0 && (
              <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    Pending Transactions
                    <Badge variant="secondary">{transactions.length}</Badge>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => setTransactions([])}
                  >
                    Clear all
                  </Button>
                </div>

                {/* Table */}
                <div className="overflow-auto max-h-56">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20 text-xs text-muted-foreground uppercase tracking-wide">
                        <th className="px-4 py-2 text-left font-medium w-14">Type</th>
                        <th className="px-4 py-2 text-left font-medium">Item</th>
                        <th className="px-4 py-2 text-right font-medium w-20">Qty</th>
                        <th className="px-4 py-2 text-right font-medium w-24">Price</th>
                        <th className="px-4 py-2 text-center font-medium w-28">Meal</th>
                        <th className="px-4 py-2 text-left font-medium w-28">Date</th>
                        <th className="px-2 py-2 w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className={cn(
                              "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wide",
                              t.type === "IN"
                                ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                                : t.category === "NON_STORED"
                                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                : "bg-red-50 text-red-600 ring-1 ring-red-200"
                            )}>
                              {t.type === "IN" ? "IN" : t.category === "NON_STORED" ? "NON" : "OUT"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-medium">{t.name}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{t.quantity}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                            {t.price != null ? `৳${t.price}` : <span className="italic text-xs">avg</span>}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {t.meal ? (
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                {t.meal.charAt(0) + t.meal.slice(1).toLowerCase()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground tabular-nums text-xs">{t.date}</td>
                          <td className="px-2 py-2.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground/30 hover:text-red-500 hover:bg-red-50"
                              onClick={() => removeTransaction(t.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t bg-muted/20 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} ready
                  </span>
                  <Button ref={submitRef} size="sm" onClick={handleSubmit} className="gap-1.5 h-7 text-xs">
                    <Send className="h-3.5 w-3.5" />
                    Submit all
                    <span className="text-[9px] opacity-50 font-mono">Ctrl+↵</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Keyboard guide */}
            {showGuide && <KeyboardGuide />}
          </div>

          {/* Right: sticky stock summary */}
          <div className="sticky top-6 self-start">
            <StockSummaryTable
              stocks={stocks}
              summarySearch={summarySearch}
              setSummarySearch={setSummarySearch}
              onItemClick={(item: unknown) => setHistoryItem(item as StockItem)}
            />
          </div>
        </div>
      )}

      {tab === "items" && (
        <StockItemsList
          categories={categories}
          units={units}
          stockItems={stockItems}
          refetchHandler={() => setRefetch((p) => !p)}
          wing={wing}
          onItemClick={(item) => setHistoryItem(item as StockItem)}
        />
      )}

      <StockItemHistory
        item={historyItem}
        wing={wing}
        open={!!historyItem}
        onOpenChange={(open: boolean) => { if (!open) setHistoryItem(null); }}
      />
    </div>
  );
};

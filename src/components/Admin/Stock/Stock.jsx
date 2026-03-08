import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Axios } from "../../../api/api";
import { StockItemsList } from "./StockItemsList";
import { StockSummaryTable } from "./StockSummaryTable";
import { StockIn } from "./StockIn";
import { StockOut } from "./StockOut";
import { NonStock } from "./NonStock";
import { Keyboard, Send, Trash2 } from "lucide-react";
import { useAuthUser } from "react-auth-kit";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

let rowCounter = 0;
const newId = () => `row-${++rowCounter}`;

const TABS = [
  { key: "stockIn",  label: "Stock In" },
  { key: "stockOut", label: "Stock Out" },
  { key: "nonStock", label: "Non-Stock" },
  { key: "items",    label: "Items" },
];

// ─── Keyboard shortcut guide ──────────────────────────────────────────────────

const Kbd = ({ children }) => (
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
  const auth = useAuthUser()();
  const [stocks, setStocks] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [refetch, setRefetch] = useState(false);
  const [wing, setWing] = useState(auth.wing === "ALL" ? "MALE" : auth.wing);
  const [tab, setTab] = useState("stockIn");
  const [transactions, setTransactions] = useState([]);
  const [summarySelectedItem, setSummarySelectedItem] = useState(null);
  const [editTransaction, setEditTransaction] = useState(null);
  const [summarySearch, setSummarySearch] = useState("");
  const [showGuide, setShowGuide] = useState(true);

  const submitRef     = useRef(null);
  const childRef      = useRef(null);
  const stockInSubmit  = useRef(null);
  const stockOutSubmit = useRef(null);
  const nonStockSubmit = useRef(null);

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

  const addTransaction = (transaction) => {
    setTransactions((prev) => [...prev, { ...transaction, id: newId() }]);
  };

  const removeTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSubmit = useCallback(async () => {
    if (transactions.length === 0) {
      toast.error("No transactions to submit.");
      return;
    }
    try {
      await toast.promise(
        Axios.post("/stock/transaction/batch", { transactions, wing }),
        {
          loading: `Submitting ${transactions.length} transaction(s)...`,
          success: `${transactions.length} transaction(s) saved!`,
          error: "Error submitting transactions.",
        }
      );
      setTransactions([]);
      setRefetch((p) => !p);
    } catch (error) {
      console.error(error);
    }
  }, [transactions, wing]);

  // Global keyboard shortcuts
  useEffect(() => {
    const tabKeys = ["stockIn", "stockOut", "nonStock", "items"];
    const handler = (e) => {
      const inInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName
      );

      // Alt+1–4: switch tabs
      if (e.altKey && e.key >= "1" && e.key <= "4") {
        e.preventDefault();
        setTab(tabKeys[parseInt(e.key) - 1]);
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
                editTransaction={editTransaction}
                summarySelectedItem={summarySelectedItem}
                setSummarySelectedItem={setSummarySelectedItem}
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
                editTransaction={editTransaction}
                setSummarySelectedItem={setSummarySelectedItem}
                childRef={childRef}
                submitRef={submitRef}
                stockOutSubmit={stockOutSubmit}
              />
            )}
            {tab === "nonStock" && (
              <NonStock
                stockItems={stockItems.filter((i) => i.category === "NON_STORED")}
                addTransaction={addTransaction}
                wing={wing}
                editTransaction={editTransaction}
                childRef={childRef}
                submitRef={submitRef}
                nonStockSubmit={nonStockSubmit}
              />
            )}

            {/* Pending transactions */}
            {transactions.length > 0 && (
              <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
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

                {/* Scrollable list */}
                <div className="divide-y max-h-52 overflow-auto">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-sm min-w-0">
                        <span className={cn(
                          "text-xs font-bold w-8 shrink-0",
                          t.type === "IN" ? "text-green-600" : t.category === "NON_STORED" ? "text-amber-600" : "text-red-500"
                        )}>
                          {t.type === "IN" ? "IN" : t.category === "NON_STORED" ? "NON" : "OUT"}
                        </span>
                        <span className="font-medium truncate">{t.name}</span>
                        <span className="text-muted-foreground tabular-nums">{t.quantity} × {t.price ?? "avg"}</span>
                        {t.meal && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
                            {t.meal}
                          </span>
                        )}
                        <span className="text-muted-foreground text-xs">{t.date}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50"
                        onClick={() => removeTransaction(t.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-3 py-2 border-t bg-muted/20 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {transactions.length} item{transactions.length !== 1 ? "s" : ""} ready to submit
                  </span>
                  <Button ref={submitRef} size="sm" onClick={handleSubmit} className="gap-1.5 h-7 text-xs">
                    <Send className="h-3.5 w-3.5" />
                    Submit
                    <span className="text-[9px] opacity-50 font-mono">Ctrl+↵</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Keyboard guide */}
            {showGuide && <KeyboardGuide />}
          </div>

          {/* Right: sticky stock summary */}
          <div className="sticky top-6 self-start h-[calc(100vh-8rem)]">
            <StockSummaryTable
              stocks={stocks}
              summarySearch={summarySearch}
              setSummarySearch={setSummarySearch}
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
        />
      )}
    </div>
  );
};

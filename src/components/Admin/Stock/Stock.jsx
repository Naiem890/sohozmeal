import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Axios } from "../../../api/api";
import { StockItemsList } from "./StockItemsList";
import { StockSummaryTable } from "./StockSummaryTable";
import { StockIn } from "./StockIn";
import { StockOut } from "./StockOut";
import { NonStock } from "./NonStock";
import { Send, Trash2 } from "lucide-react";
import { useAuthUser } from "react-auth-kit";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

let rowCounter = 0;
const newId = () => `row-${++rowCounter}`;

const TABS = [
  { key: "stockIn", label: "Stock In" },
  { key: "stockOut", label: "Stock Out" },
  { key: "nonStock", label: "Non-Stock" },
  { key: "items", label: "Items Management" },
];

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

  const submitRef = useRef(null);
  const childRef = useRef(null);
  const stockInSubmit = useRef(null);
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

  const handleSubmit = async () => {
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
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Stock</h2>
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
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab !== "items" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
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

            {/* Pending transactions list */}
            {transactions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Pending Transactions
                    <Badge variant="secondary" className="ml-2">{transactions.length}</Badge>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground text-xs"
                    onClick={() => setTransactions([])}
                  >
                    Clear all
                  </Button>
                </div>
                <div className="border rounded-md divide-y text-sm">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-3 py-2">
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className={cn(
                          "font-semibold",
                          t.type === "IN" ? "text-green-600" : t.category === "NON_STORED" ? "text-amber-600" : "text-red-600"
                        )}>
                          {t.type === "IN" ? "IN" : t.category === "NON_STORED" ? "NON" : "OUT"}
                        </span>
                        <span>{t.name}</span>
                        <span className="text-muted-foreground">{t.quantity} × {t.price ?? "avg"}</span>
                        {t.meal && <span className="text-muted-foreground">{t.meal}</span>}
                        <span className="text-muted-foreground">{t.date}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeTransaction(t.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button ref={submitRef} size="sm" onClick={handleSubmit} className="min-w-28">
                  <Send className="h-4 w-4 mr-1" />
                  Submit ({transactions.length})
                </Button>
              </div>
            )}
          </div>

          <div>
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

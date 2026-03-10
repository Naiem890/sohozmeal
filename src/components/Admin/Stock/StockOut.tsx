import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useConfirm } from "../../Common/ConfirmDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { ItemSearchInput } from "./ItemSearchInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { stockOutSchema, validateSchema } from "@/validation/stockSchemas";

const inputClass =
  "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:bg-muted disabled:cursor-not-allowed";

const errorClass = "text-xs text-red-500 mt-0.5";

interface StockEntry {
  _id: string;
  item?: { _id?: string; name?: string; unit?: string };
  quantity?: number;
  [key: string]: unknown;
}

interface StockItemOption {
  _id: string;
  itemId?: string;
  name: string;
  unit?: string;
  available?: number;
  [key: string]: unknown;
}

interface EditTransactionData {
  transaction: {
    item: string;
    quantity: string | number;
    meal: string;
    date: string;
  };
}

interface StockOutProps {
  stocks: StockEntry[];
  addTransaction: (t: object) => void;
  wing: string;
  editTransaction?: EditTransactionData | null;
  setSummarySelectedItem?: (item: StockItemOption | null) => void;
  childRef?: React.MutableRefObject<HTMLButtonElement | null>;
  submitRef?: React.MutableRefObject<HTMLButtonElement | null>;
  stockOutSubmit?: React.MutableRefObject<HTMLButtonElement | null>;
}

export const StockOut = ({
  stocks,
  addTransaction,
  wing,
  editTransaction,
  setSummarySelectedItem,
  childRef,
  submitRef,
  stockOutSubmit,
}: StockOutProps) => {
  const [selectedItem, setSelectedItem] = useState<StockItemOption | null>(null);
  const [quantity, setQuantity] = useState("");
  const [meal, setMeal] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const confirm = useConfirm()!;
  const dateRef = useRef<HTMLButtonElement | null>(null);
  const mealRef = useRef<HTMLButtonElement | null>(null);
  const itemRef = useRef<HTMLInputElement | null>(null);
  const quantityRef = useRef<HTMLInputElement | null>(null);

  const stockItems = stocks.map((s: StockEntry) => ({
    _id: s._id,
    itemId: s.item?._id,
    name: s.item?.name ?? "",
    unit: s.item?.unit ?? "",
    available: s.quantity ?? 0,
  }));

  useEffect(() => {
    if (editTransaction) {
      const { item, quantity, meal, date } = editTransaction.transaction;
      const flatItem = stockItems.find((s) => s.itemId === item);
      setSelectedItem(flatItem ?? null);
      setQuantity(String(quantity));
      setMeal(meal);
      setDate(date);
      setErrors({});
    }
  }, [editTransaction, stocks]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (childRef) childRef.current = dateRef.current;
  }, [childRef]);

  useEffect(() => {
    if (document.activeElement === document.body) dateRef.current?.focus();
  }, []);

  const handleStockOut = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateSchema(stockOutSchema, {
      item: selectedItem?.itemId ?? "",
      date,
      meal,
      quantity,
    });

    if (!validation.success) {
      setErrors(validation.errors);
      if (validation.errors.meal) setTimeout(() => mealRef.current?.focus(), 0);
      else if (validation.errors.item) setTimeout(() => itemRef.current?.focus(), 0);
      else if (validation.errors.quantity) setTimeout(() => quantityRef.current?.focus(), 0);
      return;
    }

    // Check available stock
    const { quantity: qty } = validation.data as { quantity: number };
    const available = selectedItem?.available ?? 0;
    if (qty > available) {
      setErrors({ quantity: `Exceeds available stock (${available} ${selectedItem?.unit ?? ""})` });
      setTimeout(() => quantityRef.current?.focus(), 0);
      return;
    }

    setErrors({});
    const ok = await confirm({
      title: "Confirm Stock Out",
      description: `Stock out ${qty} unit(s) of ${selectedItem!.name} for ${meal} on ${date}?`,
      confirmText: "Confirm",
      cancelText: "Cancel",
    });
    if (ok) {
      addTransaction({
        type: "OUT",
        item: selectedItem!.itemId,
        name: selectedItem!.name,
        quantity: qty,
        meal,
        date,
        category: "STORED",
        wing,
      });
      toast.success(editTransaction ? "Stock out transaction updated!" : "Stock out transaction added locally!");
      resetForm();
    } else {
      setTimeout(() => dateRef.current?.focus(), 0);
    }
  };

  const resetForm = () => {
    setSelectedItem(null);
    setQuantity("");
    setMeal("");
    setErrors({});
    setTimeout(() => dateRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<{ focus: () => void } | null> | null | undefined, prevRef: React.RefObject<{ focus: () => void } | null> | null | undefined) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); nextRef?.current?.focus(); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); prevRef?.current?.focus(); }
  };

  return (
    <form onSubmit={handleStockOut} className="mb-4" noValidate>
      <div className="flex gap-2 flex-wrap items-start">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Date</Label>
          <DatePicker
            ref={dateRef}
            value={date}
            onChange={(d) => setDate(format(d, "yyyy-MM-dd"))}
            onKeyDown={(e) => handleKeyDown(e, mealRef, null)}
            className="w-36"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Meal</Label>
          <Select
            value={meal}
            onValueChange={(v) => {
              setMeal(v);
              if (errors.meal) setErrors((p) => ({ ...p, meal: undefined }));
              setTimeout(() => itemRef.current?.focus(), 0);
            }}
          >
            <SelectTrigger
              ref={mealRef}
              className={`h-9 w-36 ${errors.meal ? "border-red-500" : ""}`}
              onKeyDown={(e) => handleKeyDown(e, itemRef, dateRef)}
            >
              <SelectValue placeholder="Meal" />
            </SelectTrigger>
            <SelectContent>
              {["BREAKFAST", "LUNCH", "DINNER"].map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.meal && <p className={errorClass}>{errors.meal}</p>}
        </div>
        <div className="w-48">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Item</Label>
          <ItemSearchInput
            ref={itemRef}
            items={stockItems}
            value={selectedItem}
            onChange={(item) => {
              setSelectedItem(item);
              setSummarySelectedItem?.(item);
              if (errors.item) setErrors((p) => ({ ...p, item: undefined }));
              if (item) setTimeout(() => quantityRef.current?.focus(), 0);
            }}
            onKeyDown={(e) => handleKeyDown(e, quantityRef, mealRef)}
            placeholder="Search item..."
          />
          {errors.item && <p className={errorClass}>{errors.item}</p>}
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            Quantity
            {selectedItem && (
              <span className="ml-1 text-muted-foreground/70">
                (avail: {selectedItem.available} {selectedItem.unit})
              </span>
            )}
          </Label>
          <input
            ref={quantityRef}
            className={`${inputClass} ${errors.quantity ? "border-red-500" : ""}`}
            type="number"
            step="any"
            min="0.001"
            placeholder="eg: 10"
            value={quantity}
            onChange={(e) => { setQuantity(e.target.value); if (errors.quantity) setErrors((p) => ({ ...p, quantity: undefined })); }}
            onKeyDown={(e) => handleKeyDown(e, stockOutSubmit, itemRef)}
          />
          {errors.quantity && <p className={errorClass}>{errors.quantity}</p>}
        </div>
      </div>
      <div className="mt-3">
        <Button
          ref={stockOutSubmit}
          type="submit"
          size="sm"
          variant="destructive"
          className="w-24"
          onKeyDown={(e) => handleKeyDown(e, submitRef, quantityRef)}
        >
          {editTransaction ? "Update" : "Stock Out"}
        </Button>
      </div>
    </form>
  );
};

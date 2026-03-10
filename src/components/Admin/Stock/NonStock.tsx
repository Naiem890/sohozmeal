import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
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
import { nonStockSchema, validateSchema } from "@/validation/stockSchemas";

const inputClass =
  "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:bg-muted disabled:cursor-not-allowed";

const errorClass = "text-xs text-red-500 mt-0.5";

interface StockItemOption {
  _id: string;
  name: string;
  unit?: string;
  category?: string;
  [key: string]: unknown;
}

interface EditTransactionData {
  transaction: {
    item: string;
    quantity: string | number;
    meal: string;
    date: string;
    price: string | number;
  };
}

interface NonStockProps {
  stockItems: StockItemOption[];
  addTransaction: (t: object) => void;
  wing: string;
  editTransaction?: EditTransactionData | null;
  childRef?: React.MutableRefObject<HTMLButtonElement | null>;
  submitRef?: React.MutableRefObject<HTMLButtonElement | null>;
  nonStockSubmit?: React.MutableRefObject<HTMLButtonElement | null>;
}

export const NonStock = ({
  stockItems,
  addTransaction,
  wing,
  editTransaction,
  childRef,
  submitRef,
  nonStockSubmit,
}: NonStockProps) => {
  const [selectedItem, setSelectedItem] = useState<StockItemOption | null>(null);
  const [quantity, setQuantity] = useState("");
  const [meal, setMeal] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [price, setPrice] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const dateRef = useRef<HTMLButtonElement | null>(null);
  const mealRef = useRef<HTMLButtonElement | null>(null);
  const itemRef = useRef<HTMLInputElement | null>(null);
  const priceRef = useRef<HTMLInputElement | null>(null);
  const quantityRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editTransaction) {
      const { item, quantity, meal, date, price } = editTransaction.transaction;
      const selected = stockItems.find((i) => i._id === item);
      setSelectedItem(selected ?? null);
      setQuantity(String(quantity));
      setMeal(meal);
      setDate(date);
      setPrice(String(price));
      setErrors({});
    }
  }, [editTransaction, stockItems]);

  useEffect(() => {
    if (childRef) childRef.current = dateRef.current;
  }, [childRef]);

  useEffect(() => {
    if (document.activeElement === document.body) dateRef.current?.focus();
  }, []);

  const handleStockOut = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateSchema(nonStockSchema, {
      item: selectedItem?._id ?? "",
      date,
      meal,
      price,
      quantity,
    });

    if (!validation.success) {
      setErrors(validation.errors);
      if (validation.errors.meal) setTimeout(() => mealRef.current?.focus(), 0);
      else if (validation.errors.item) setTimeout(() => itemRef.current?.focus(), 0);
      else if (validation.errors.price) setTimeout(() => priceRef.current?.focus(), 0);
      else if (validation.errors.quantity) setTimeout(() => quantityRef.current?.focus(), 0);
      return;
    }

    setErrors({});
    const { quantity: qty, price: unitPrice } = validation.data as { quantity: number; price: number };

    addTransaction({
      type: "OUT",
      item: selectedItem!._id,
      name: selectedItem!.name,
      quantity: qty,
      meal,
      date,
      price: unitPrice,
      category: "NON_STORED",
      wing,
    });
    toast.success(editTransaction ? "Non-stock transaction updated locally!" : "Non-stock transaction added locally!");
    resetForm();
  };

  const resetForm = () => {
    setSelectedItem(null);
    setQuantity("");
    setMeal("");
    setPrice("");
    setErrors({});
    setTimeout(() => dateRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<{ focus: () => void } | null> | null | undefined, prevRef: React.RefObject<{ focus: () => void } | null> | null | undefined) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); nextRef?.current?.focus(); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); prevRef?.current?.focus(); }
  };

  return (
    <form onSubmit={handleStockOut} className="mb-4" noValidate>
      <div className="flex flex-wrap gap-2 items-start">
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
        <div className="w-36">
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
              className={`h-9 w-full ${errors.meal ? "border-red-500" : ""}`}
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
              if (errors.item) setErrors((p) => ({ ...p, item: undefined }));
              if (item) setTimeout(() => priceRef.current?.focus(), 0);
            }}
            onKeyDown={(e) => handleKeyDown(e, priceRef, mealRef)}
            placeholder="Search item..."
          />
          {errors.item && <p className={errorClass}>{errors.item}</p>}
        </div>
        <div className="w-28">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Price (per unit)</Label>
          <input
            ref={priceRef}
            className={`${inputClass} w-full ${errors.price ? "border-red-500" : ""}`}
            type="number"
            step="any"
            min="0.001"
            placeholder="eg: 10"
            value={price}
            onChange={(e) => { setPrice(e.target.value); if (errors.price) setErrors((p) => ({ ...p, price: undefined })); }}
            onKeyDown={(e) => handleKeyDown(e, quantityRef, itemRef)}
          />
          {errors.price && <p className={errorClass}>{errors.price}</p>}
        </div>
        <div className="w-28">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Quantity</Label>
          <input
            ref={quantityRef}
            className={`${inputClass} w-full ${errors.quantity ? "border-red-500" : ""}`}
            type="number"
            step="any"
            min="0.001"
            placeholder="eg: 100"
            value={quantity}
            onChange={(e) => { setQuantity(e.target.value); if (errors.quantity) setErrors((p) => ({ ...p, quantity: undefined })); }}
            onKeyDown={(e) => handleKeyDown(e, nonStockSubmit, priceRef)}
          />
          {errors.quantity && <p className={errorClass}>{errors.quantity}</p>}
        </div>
      </div>
      <div className="mt-3">
        <Button
          ref={nonStockSubmit}
          type="submit"
          size="sm"
          className="w-24 bg-amber-600 hover:bg-amber-700"
          onKeyDown={(e) => handleKeyDown(e, submitRef, quantityRef)}
        >
          {editTransaction ? "Update" : "Stock Out"}
        </Button>
      </div>
    </form>
  );
};

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

const inputClass =
  "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:bg-muted disabled:cursor-not-allowed";

export const NonStock = ({
  stockItems,
  addTransaction,
  wing,
  editTransaction,
  childRef,
  submitRef,
  nonStockSubmit,
}) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [meal, setMeal] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [price, setPrice] = useState("");

  const dateRef = useRef(null);
  const mealRef = useRef(null);
  const itemRef = useRef(null);
  const priceRef = useRef(null);
  const quantityRef = useRef(null);

  useEffect(() => {
    if (editTransaction) {
      const { item, quantity, meal, date, price } = editTransaction.transaction;
      const selected = stockItems.find((i) => i._id === item);
      setSelectedItem(selected);
      setQuantity(quantity);
      setMeal(meal);
      setDate(date);
      setPrice(price);
    }
  }, [editTransaction, stockItems]);

  useEffect(() => {
    if (childRef) childRef.current = dateRef.current;
  }, [childRef]);

  useEffect(() => {
    if (document.activeElement === document.body) dateRef.current?.focus();
  }, []);

  const handleStockOut = (e) => {
    e.preventDefault();
    if (!selectedItem) { toast.error("Please select a valid item."); return; }
    addTransaction({ type: "OUT", item: selectedItem._id, name: selectedItem.name, quantity, meal, date, price, category: "NON_STORED", wing });
    toast.success(editTransaction ? "Non-stock transaction updated locally!" : "Non-stock transaction added locally!");
    resetForm();
  };

  const resetForm = () => {
    setSelectedItem(null);
    setQuantity("");
    setMeal("");
    setPrice("");
    setTimeout(() => dateRef.current?.focus(), 0);
  };

  const handleKeyDown = (e, nextRef, prevRef) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); nextRef?.current?.focus(); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); prevRef?.current?.focus(); }
  };

  return (
    <form onSubmit={handleStockOut} className="mb-4">
      <div className="flex flex-wrap gap-2">
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
          <Select required value={meal} onValueChange={(v) => { setMeal(v); setTimeout(() => itemRef.current?.focus(), 0); }}>
            <SelectTrigger
              ref={mealRef}
              className="h-9 w-full"
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
        </div>
        <div className="w-48">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Item</Label>
          <ItemSearchInput
            ref={itemRef}
            items={stockItems}
            value={selectedItem}
            onChange={(item) => {
              setSelectedItem(item);
              if (item) setTimeout(() => priceRef.current?.focus(), 0);
            }}
            onKeyDown={(e) => handleKeyDown(e, priceRef, mealRef)}
            placeholder="Search item..."
          />
        </div>
        <div className="w-28">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Price (per unit)</Label>
          <input
            ref={priceRef}
            className={`${inputClass} w-full`}
            type="number"
            step="any"
            placeholder="eg: 10"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            onKeyDown={(e) => handleKeyDown(e, quantityRef, itemRef)}
          />
        </div>
        <div className="w-28">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Quantity</Label>
          <input
            ref={quantityRef}
            className={`${inputClass} w-full`}
            type="number"
            step="any"
            placeholder="eg: 100"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            onKeyDown={(e) => handleKeyDown(e, nonStockSubmit, priceRef)}
          />
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

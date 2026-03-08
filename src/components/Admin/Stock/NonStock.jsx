import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ItemSearchInput } from "./ItemSearchInput";

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
          <input
            ref={dateRef}
            required
            className={inputClass}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, mealRef, null)}
          />
        </div>
        <div className="w-32">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Meal</Label>
          <select
            ref={mealRef}
            required
            className={`${inputClass} w-full`}
            value={meal}
            onChange={(e) => setMeal(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, itemRef, dateRef)}
          >
            <option value="" disabled>Meal</option>
            {["BREAKFAST", "LUNCH", "DINNER"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
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

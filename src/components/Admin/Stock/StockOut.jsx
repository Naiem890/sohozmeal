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

const inputClass =
  "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:bg-muted disabled:cursor-not-allowed";

export const StockOut = ({
  stocks,
  addTransaction,
  wing,
  editTransaction,
  setSummarySelectedItem,
  childRef,
  submitRef,
  stockOutSubmit,
}) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [meal, setMeal] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const confirm = useConfirm();
  const dateRef = useRef(null);
  const mealRef = useRef(null);
  const itemRef = useRef(null);
  const quantityRef = useRef(null);

  const stockItems = stocks.map((s) => ({
    _id: s._id,
    itemId: s.item?._id,
    name: s.item?.name,
    unit: s.item?.unit,
    available: s.quantity,
  }));

  useEffect(() => {
    if (editTransaction) {
      const { item, quantity, meal, date } = editTransaction.transaction;
      const flatItem = stockItems.find((s) => s.itemId === item);
      setSelectedItem(flatItem ?? null);
      setQuantity(quantity);
      setMeal(meal);
      setDate(date);
    }
  }, [editTransaction, stocks]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (childRef) childRef.current = dateRef.current;
  }, [childRef]);

  useEffect(() => {
    if (document.activeElement === document.body) dateRef.current?.focus();
  }, []);

  const handleStockOut = async (e) => {
    e.preventDefault();
    if (!selectedItem) { toast.error("Please select a valid item"); return; }
    const ok = await confirm({
      title: "Confirm Stock Out",
      description: `Stock out ${quantity} unit(s) of ${selectedItem.name} for ${meal} on ${date}?`,
      confirmText: "Confirm",
      cancelText: "Cancel",
    });
    if (ok) {
      addTransaction({ type: "OUT", item: selectedItem.itemId, name: selectedItem.name, quantity, meal, date, category: "STORED", wing });
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
    setTimeout(() => dateRef.current?.focus(), 0);
  };

  const handleKeyDown = (e, nextRef, prevRef) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); nextRef?.current?.focus(); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); prevRef?.current?.focus(); }
  };

  return (
    <form onSubmit={handleStockOut} className="mb-4">
      <div className="flex gap-2 flex-wrap">
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
          <Select required value={meal} onValueChange={(v) => { setMeal(v); setTimeout(() => itemRef.current?.focus(), 0); }}>
            <SelectTrigger
              ref={mealRef}
              className="h-9 w-36"
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
              setSummarySelectedItem(item);
              if (item) setTimeout(() => quantityRef.current?.focus(), 0);
            }}
            onKeyDown={(e) => handleKeyDown(e, quantityRef, mealRef)}
            placeholder="Search item..."
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Quantity</Label>
          <input
            ref={quantityRef}
            className={inputClass}
            type="number"
            step="any"
            placeholder="eg: 10"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            onKeyDown={(e) => handleKeyDown(e, stockOutSubmit, itemRef)}
          />
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

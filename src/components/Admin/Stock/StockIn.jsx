import React, { useEffect, useRef, useState } from "react";
import { useConfirm } from "../../Common/ConfirmDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ItemSearchInput } from "./ItemSearchInput";

const inputClass =
  "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:bg-muted disabled:cursor-not-allowed";

export const StockIn = ({
  stockItems,
  addTransaction,
  wing,
  editTransaction,
  summarySelectedItem,
  setSummarySelectedItem,
  childRef,
  submitRef,
  stockInSubmit,
}) => {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const confirm = useConfirm();
  const dateRef = useRef(null);
  const itemRef = useRef(null);
  const quantityRef = useRef(null);
  const priceRef = useRef(null);

  useEffect(() => {
    if (childRef) childRef.current = dateRef.current;
  }, [childRef]);

  useEffect(() => {
    dateRef.current?.focus();
  }, []);

  useEffect(() => {
    if (editTransaction) {
      const { item, quantity, price, date } = editTransaction.transaction;
      const selectedItem = stockItems.find((i) => i._id === item);
      setSummarySelectedItem(selectedItem);
      setQuantity(quantity);
      setPrice(price);
      setDate(date);
    }
  }, [editTransaction, stockItems, setSummarySelectedItem]);

  const handleStockIn = async (e) => {
    e.preventDefault();
    if (!summarySelectedItem) { toast.error("Please select a valid item"); setTimeout(() => dateRef.current?.focus(), 0); return; }
    const ok = await confirm({
      title: "Confirm Stock In",
      description: `Add ${quantity} × ${summarySelectedItem?.name} at ${price}/unit?`,
      confirmText: "Add",
      cancelText: "Cancel",
    });
    if (ok) {
      addTransaction({ type: "IN", item: summarySelectedItem._id, name: summarySelectedItem.name, quantity, price, date, wing });
      toast.success(editTransaction ? "Transaction updated!" : "Transaction added locally!");
      reset();
    } else {
      setTimeout(() => dateRef.current?.focus(), 0);
    }
  };

  const reset = () => {
    setSummarySelectedItem(null);
    setQuantity("");
    setPrice("");
    setTimeout(() => dateRef.current?.focus(), 0);
  };

  const handleKeyDown = (e, nextRef, prevRef) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); nextRef?.current?.focus(); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); prevRef?.current?.focus(); }
  };

  return (
    <form onSubmit={handleStockIn} className="mb-4">
      <div className="flex gap-2 flex-wrap">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Date</Label>
          <input
            ref={dateRef}
            required
            className={inputClass}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, itemRef, null)}
          />
        </div>
        <div className="w-48">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Item</Label>
          <ItemSearchInput
            ref={itemRef}
            items={stockItems.filter((i) => i.category === "STORED")}
            value={summarySelectedItem}
            onChange={(item) => {
              setSummarySelectedItem(item);
              if (item) setTimeout(() => quantityRef.current?.focus(), 0);
            }}
            onKeyDown={(e) => handleKeyDown(e, quantityRef, dateRef)}
            placeholder="Search item..."
          />
        </div>
        <div className="w-28">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Quantity</Label>
          <input
            ref={quantityRef}
            className={`${inputClass} w-full`}
            type="number"
            step="any"
            placeholder="eg: 10"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            onKeyDown={(e) => handleKeyDown(e, priceRef, itemRef)}
          />
        </div>
        <div className="w-28">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Price Per Unit</Label>
          <input
            ref={priceRef}
            className={`${inputClass} w-full`}
            type="number"
            step="any"
            placeholder="eg: 100"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            onKeyDown={(e) => handleKeyDown(e, stockInSubmit, quantityRef)}
          />
        </div>
      </div>
      <div className="mt-3">
        <Button
          ref={stockInSubmit}
          type="submit"
          size="sm"
          className="w-24"
          onKeyDown={(e) => handleKeyDown(e, submitRef, priceRef)}
        >
          {editTransaction ? "Update" : "Stock In"}
        </Button>
      </div>
    </form>
  );
};

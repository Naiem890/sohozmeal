import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useConfirm } from "../../Common/ConfirmDialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { ItemSearchInput } from "./ItemSearchInput";
import { stockInSchema, validateSchema } from "@/validation/stockSchemas";

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

interface EditTransaction {
  transaction: {
    item: string;
    quantity: string | number;
    price: string | number;
    date: string;
  };
}

interface StockInProps {
  stockItems: StockItemOption[];
  addTransaction: (t: object) => void;
  wing: string;
  editTransaction?: EditTransaction | null;
  summarySelectedItem: StockItemOption | null;
  setSummarySelectedItem: (item: StockItemOption | null) => void;
  childRef?: React.MutableRefObject<HTMLButtonElement | null>;
  submitRef?: React.MutableRefObject<HTMLButtonElement | null>;
  stockInSubmit?: React.MutableRefObject<HTMLButtonElement | null>;
}

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
}: StockInProps) => {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const confirm = useConfirm()!;
  const dateRef = useRef<HTMLButtonElement | null>(null);
  const itemRef = useRef<HTMLInputElement | null>(null);
  const quantityRef = useRef<HTMLInputElement | null>(null);
  const priceRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (childRef) childRef.current = dateRef.current;
  }, [childRef]);

  useEffect(() => {
    dateRef.current?.focus();
  }, []);

  useEffect(() => {
    if (editTransaction) {
      const { item, quantity, price, date } = editTransaction.transaction;
      const selectedItem = stockItems.find((i: StockItemOption) => i._id === item);
      setSummarySelectedItem(selectedItem ?? null);
      setQuantity(String(quantity));
      setPrice(String(price));
      setDate(date);
      setErrors({});
    }
  }, [editTransaction, stockItems, setSummarySelectedItem]);

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateSchema(stockInSchema, {
      item: summarySelectedItem?._id ?? "",
      date,
      quantity,
      price,
    });

    if (!validation.success) {
      setErrors(validation.errors);
      // Focus first errored field
      if (validation.errors.item) setTimeout(() => itemRef.current?.focus(), 0);
      else if (validation.errors.quantity) setTimeout(() => quantityRef.current?.focus(), 0);
      else if (validation.errors.price) setTimeout(() => priceRef.current?.focus(), 0);
      return;
    }

    setErrors({});
    const { quantity: qty, price: unitPrice } = validation.data as { quantity: number; price: number };

    const ok = await confirm({
      title: "Confirm Stock In",
      description: `Add ${qty} × ${summarySelectedItem?.name} at ${unitPrice}/unit?`,
      confirmText: "Add",
      cancelText: "Cancel",
    });
    if (ok) {
      addTransaction({
        type: "IN",
        item: summarySelectedItem!._id,
        name: summarySelectedItem!.name,
        quantity: qty,
        price: unitPrice,
        date,
        wing,
      });
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
    setErrors({});
    setTimeout(() => dateRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<{ focus: () => void } | null> | null | undefined, prevRef: React.RefObject<{ focus: () => void } | null> | null | undefined) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); nextRef?.current?.focus(); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); prevRef?.current?.focus(); }
  };

  return (
    <form onSubmit={handleStockIn} className="mb-4" noValidate>
      <div className="flex gap-2 flex-wrap items-start">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Date</Label>
          <DatePicker
            ref={dateRef}
            value={date}
            onChange={(d) => setDate(format(d, "yyyy-MM-dd"))}
            onKeyDown={(e) => handleKeyDown(e, itemRef, null)}
            className="w-36"
          />
        </div>
        <div className="w-48">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Item</Label>
          <ItemSearchInput
            ref={itemRef}
            items={stockItems.filter((i) => i.category === "STORED")}
            value={summarySelectedItem}
            onChange={(item: StockItemOption | null) => {
              setSummarySelectedItem(item);
              if (errors.item) setErrors((p) => ({ ...p, item: undefined }));
              if (item) setTimeout(() => quantityRef.current?.focus(), 0);
            }}
            onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, quantityRef, dateRef)}
            placeholder="Search item..."
          />
          {errors.item && <p className={errorClass}>{errors.item}</p>}
        </div>
        <div className="w-28">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Quantity</Label>
          <input
            ref={quantityRef}
            className={`${inputClass} w-full ${errors.quantity ? "border-red-500" : ""}`}
            type="number"
            step="any"
            min="0.001"
            placeholder="eg: 10"
            value={quantity}
            onChange={(e) => { setQuantity(e.target.value); if (errors.quantity) setErrors((p) => ({ ...p, quantity: undefined })); }}
            onKeyDown={(e) => handleKeyDown(e, priceRef, itemRef)}
          />
          {errors.quantity && <p className={errorClass}>{errors.quantity}</p>}
        </div>
        <div className="w-28">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Price Per Unit</Label>
          <input
            ref={priceRef}
            className={`${inputClass} w-full ${errors.price ? "border-red-500" : ""}`}
            type="number"
            step="any"
            min="0.001"
            placeholder="eg: 100"
            value={price}
            onChange={(e) => { setPrice(e.target.value); if (errors.price) setErrors((p) => ({ ...p, price: undefined })); }}
            onKeyDown={(e) => handleKeyDown(e, stockInSubmit, quantityRef)}
          />
          {errors.price && <p className={errorClass}>{errors.price}</p>}
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

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Transaction {
  _id: string;
  type: string;
  quantityChange: number;
  transactionAmount?: number;
  unitPrice?: number;
  meal?: string;
  item?: { name?: string; unit?: string; category?: string };
  [key: string]: unknown;
}

interface StockInfo {
  available: number;
  unit?: string;
}

interface EditTransactionModalProps {
  visible: boolean;
  record: Transaction;
  handleSave: (record: Transaction) => void;
  handleCancel: () => void;
  stockInfo?: StockInfo | null;
}

const EditTransactionModal = ({ visible, record, handleSave, handleCancel, stockInfo }: EditTransactionModalProps) => {
  const [formData, setFormData] = useState<Transaction>(record);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pricePerUnit, setPricePerUnit] = useState<number>(
    record.unitPrice ??
    (record.transactionAmount != null && record.quantityChange
      ? record.transactionAmount / record.quantityChange
      : 0)
  );

  useEffect(() => {
    if (record) {
      setFormData(record);
      setPricePerUnit(
        record.unitPrice ??
        (record.transactionAmount != null && record.quantityChange
          ? record.transactionAmount / record.quantityChange
          : 0)
      );
    }
  }, [record]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (formData.quantityChange <= 0) e.quantityChange = "Must be greater than zero";
    if (formData.type === "IN" && pricePerUnit <= 0) e.pricePerUnit = "Must be greater than zero";
    if (formData.item?.category === "NON_STORED" && pricePerUnit <= 0) e.pricePerUnit = "Must be greater than zero";

    // Stock availability check for STORED OUT transactions
    if (formData.type === "OUT" && formData.item?.category === "STORED" && stockInfo) {
      const qtyIncrease = formData.quantityChange - record.quantityChange;
      if (qtyIncrease > 0 && qtyIncrease > stockInfo.available) {
        e.quantityChange = `Exceeds available stock. Can increase by at most ${stockInfo.available} ${stockInfo.unit || ""}`.trim();
      }
    }

    // Stock availability check when reducing STORED IN
    if (formData.type === "IN" && formData.item?.category === "STORED" && stockInfo) {
      const qtyDecrease = record.quantityChange - formData.quantityChange;
      if (qtyDecrease > 0 && qtyDecrease > stockInfo.available) {
        e.quantityChange = `Cannot reduce by ${qtyDecrease}. Only ${stockInfo.available} ${stockInfo.unit || ""} available in stock`.trim();
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData({ ...formData, [name]: type === "number" ? (value === "" ? "" : parseFloat(value)) : value });
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validate()) {
      const updated: Transaction = {
        ...formData,
        transactionAmount: pricePerUnit * formData.quantityChange,
        pricePerUnit,
      };
      handleSave(updated);
    }
  };

  return (
    <Dialog open={visible} onOpenChange={(open) => { if (!open) handleCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Item Name</Label>
            <Input value={formData?.item?.name || ""} disabled />
          </div>

          <div className="space-y-1.5">
            <Label>Quantity</Label>
            <Input
              type="number"
              name="quantityChange"
              step="any"
              min="0"
              value={formData.quantityChange || ""}
              onChange={handleChange}
              required
            />
            {errors.quantityChange && <p className="text-xs text-destructive">{errors.quantityChange}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Transaction Type</Label>
            <Input value={formData.type} disabled />
          </div>

          {formData?.type !== "IN" && (
            <div className="space-y-1.5">
              <Label>Meal</Label>
              <Select value={formData.meal} onValueChange={(v) => setFormData({ ...formData, meal: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                  <SelectItem value="LUNCH">Lunch</SelectItem>
                  <SelectItem value="DINNER">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(formData?.item?.category === "NON_STORED" || formData.type === "IN") && (
            <div className="space-y-1.5">
              <Label>Unit Price</Label>
              <Input
                type="number"
                step="any"
                min="0"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(parseFloat(e.target.value) || 0)}
                required={formData.type === "IN"}
                disabled={formData.type === "OUT" && formData?.item?.category === "STORED"}
              />
              {errors.pricePerUnit && <p className="text-xs text-destructive">{errors.pricePerUnit}</p>}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionModal;

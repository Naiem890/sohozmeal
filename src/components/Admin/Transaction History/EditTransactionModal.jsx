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

const EditTransactionModal = ({ visible, record, handleSave, handleCancel }) => {
  const [formData, setFormData] = useState(record);
  const [errors, setErrors] = useState({});
  const [pricePerUnit, setPricePerUnit] = useState(
    record.transactionAmount / record.quantityChange || "0"
  );

  useEffect(() => {
    if (record) {
      setFormData(record);
      setPricePerUnit(record.transactionAmount / record.quantityChange);
    }
  }, [record]);

  const validate = () => {
    const e = {};
    if (formData.quantityChange <= 0) e.quantityChange = "Must be greater than zero";
    if (formData.type === "IN" && pricePerUnit <= 0) e.pricePerUnit = "Must be greater than zero";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({ ...formData, [name]: type === "number" ? (value === "" ? "" : parseFloat(value)) : value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      formData.transactionAmount = pricePerUnit * formData.quantityChange;
      formData.pricePerUnit = pricePerUnit;
      handleSave(formData);
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
                onChange={(e) => setPricePerUnit(e.target.value)}
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

import { Pencil, Search, Trash2 } from "lucide-react";
import React, { useRef, useState } from "react";
import { Axios } from "../../../api/api";
import { toast } from "sonner";
import { useConfirm } from "../../Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { stockItemSchema, validateSchema } from "@/validation/stockSchemas";

const inputClass =
  "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:bg-muted disabled:cursor-not-allowed";

interface StockItem {
  _id: string;
  name: string;
  unit: string;
  category: string;
}

interface StockItemsListProps {
  stockItems: StockItem[];
  units: string[];
  categories: string[];
  refetchHandler: () => void;
  wing: string;
  onItemClick?: (item: StockItem) => void;
}

export const StockItemsList = ({
  stockItems,
  units,
  categories,
  refetchHandler,
  wing,
  onItemClick,
}: StockItemsListProps) => {
  const confirm = useConfirm()!;
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const nameRef = useRef<HTMLInputElement | null>(null);
  const unitRef = useRef<HTMLSelectElement | null>(null);
  const categoryRef = useRef<HTMLSelectElement | null>(null);
  const submitBtnRef = useRef<HTMLButtonElement | null>(null);

  const validateItem = () => {
    const validation = validateSchema(stockItemSchema, { name, unit, category });
    if (!validation.success) {
      setErrors(validation.errors);
      if (validation.errors.name) setTimeout(() => nameRef.current?.focus(), 0);
      else if (validation.errors.unit) setTimeout(() => unitRef.current?.focus(), 0);
      else if (validation.errors.category) setTimeout(() => categoryRef.current?.focus(), 0);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateItem()) return;
    try {
      await Axios.post("/stock/item", { item: { name: name.trim(), unit, category, wing } });
      toast.success("Item added successfully!");
      refetchHandler();
      reset();
    } catch (error) {
      const e = error as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error ?? "Failed to add item");
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateItem()) return;
    try {
      await Axios.put(`/stock/item/${editItemId}`, { item: { name: name.trim(), unit, category, wing } });
      toast.success("Item updated successfully!");
      refetchHandler();
      reset();
      setEditItemId(null);
    } catch (error) {
      const e = error as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error ?? "Failed to update item");
    }
  };

  const reset = () => {
    setEditItemId(null);
    setName("");
    setUnit("");
    setCategory("");
    setErrors({});
    setTimeout(() => nameRef.current?.focus(), 0);
  };

  const handleDeleteStockItem = async (id: string) => {
    const ok = await confirm({
      title: "Delete item?",
      description: "This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (ok) {
      try {
        const res = await Axios.delete(`/stock/item/${id}?wing=${wing}`);
        toast.success(res.data.message);
        refetchHandler();
      } catch (error) {
        const e = error as { response?: { data?: { error?: string } } };
        toast.error(e.response?.data?.error ?? "Failed to delete item");
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    nextRef: React.RefObject<{ focus: () => void } | null> | null | undefined,
    prevRef: React.RefObject<{ focus: () => void } | null> | null | undefined
  ) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); nextRef?.current?.focus(); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); prevRef?.current?.focus(); }
  };

  const filtered = search
    ? stockItems.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : stockItems;

  return (
    <div className="w-full max-w-max space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <div className="overflow-auto max-h-64 border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow
                key={item._id}
                onClick={() => onItemClick?.(item)}
                className={onItemClick ? "cursor-pointer hover:bg-muted/60 transition-colors" : ""}
              >
                <TableCell className="text-sm">{item.name}</TableCell>
                <TableCell className="text-sm">{item.unit}</TableCell>
                <TableCell>
                  <Badge variant={item.category === "STORED" ? "success" : "default"} className="text-xs">
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-sky-500 hover:text-sky-600 hover:bg-sky-50"
                      onClick={() => {
                        setEditItemId(item._id);
                        setName(item.name);
                        setUnit(item.unit);
                        setCategory(item.category);
                        setTimeout(() => nameRef.current?.focus(), 0);
                      }}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteStockItem(item._id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <form onSubmit={editItemId ? handleUpdateItem : handleAddItem} className="mt-4" noValidate>
        <div className="flex flex-wrap gap-2 items-start">
          <div className="w-32">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Name</Label>
            <input
              ref={nameRef}
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
              onKeyDown={(e) => handleKeyDown(e, unitRef, null)}
              className={`${inputClass} w-full ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
          </div>
          <div className="w-24">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Unit</Label>
            <select
              ref={unitRef}
              value={unit}
              onChange={(e) => { setUnit(e.target.value); if (errors.unit) setErrors((p) => ({ ...p, unit: undefined })); }}
              onKeyDown={(e) => handleKeyDown(e, categoryRef, nameRef)}
              className={`${inputClass} w-full ${errors.unit ? "border-red-500" : ""}`}
            >
              <option value="" disabled>Unit</option>
              {units.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            {errors.unit && <p className="text-xs text-red-500 mt-0.5">{errors.unit}</p>}
          </div>
          <div className="w-36">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Category</Label>
            <select
              ref={categoryRef}
              value={category}
              onChange={(e) => { setCategory(e.target.value); if (errors.category) setErrors((p) => ({ ...p, category: undefined })); }}
              onKeyDown={(e) => handleKeyDown(e, submitBtnRef, unitRef)}
              className={`${inputClass} w-full ${errors.category ? "border-red-500" : ""}`}
            >
              <option value="" disabled>Category</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-0.5">{errors.category}</p>}
          </div>
          <div className="flex items-start gap-2 pt-5">
            {editItemId && (
              <Button type="button" variant="outline" size="sm" onClick={reset}>
                Cancel
              </Button>
            )}
            <Button
              ref={submitBtnRef}
              type="submit"
              size="sm"
              className="w-20"
              onKeyDown={(e) => handleKeyDown(e, nameRef, categoryRef)}
            >
              {editItemId ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

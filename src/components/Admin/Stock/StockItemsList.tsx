import { Pencil, Plus, Search, Trash2, Flame } from "lucide-react";
import React, { useRef, useState } from "react";
import { Axios } from "../../../api/api";
import { toast } from "sonner";
import { useConfirm } from "../../Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [search, setSearch] = useState("");

  // Add / edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);

  // Force-delete dialog state
  const [forceDeleteItem, setForceDeleteItem] = useState<StockItem | null>(null);
  const [forceDeleteInput, setForceDeleteInput] = useState("");
  const [forceDeleting, setForceDeleting] = useState(false);

  const nameRef = useRef<HTMLInputElement | null>(null);

  const openAdd = () => {
    setEditItem(null);
    setName("");
    setUnit("");
    setCategory("");
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: StockItem) => {
    setEditItem(item);
    setName(item.name);
    setUnit(item.unit);
    setCategory(item.category);
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setErrors({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateSchema(stockItemSchema, { name, unit, category });
    if (!validation.success) {
      setErrors(validation.errors);
      if (validation.errors.name) setTimeout(() => nameRef.current?.focus(), 0);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (editItem) {
        await Axios.put(`/stock/item/${editItem._id}`, { item: { name: name.trim(), unit, category, wing } });
        toast.success("Item updated successfully!");
      } else {
        await Axios.post("/stock/item", { item: { name: name.trim(), unit, category, wing } });
        toast.success("Item added successfully!");
      }
      refetchHandler();
      closeModal();
    } catch (error) {
      const e = error as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error ?? (editItem ? "Failed to update item" : "Failed to add item"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
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

  const handleForceDelete = async () => {
    if (!forceDeleteItem || forceDeleteInput.trim() !== forceDeleteItem.name) return;
    setForceDeleting(true);
    try {
      const res = await Axios.delete(`/stock/item/${forceDeleteItem._id}/force?wing=${wing}`);
      toast.success(res.data.message);
      setForceDeleteItem(null);
      setForceDeleteInput("");
      refetchHandler();
    } catch (error) {
      const e = error as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error ?? "Force delete failed");
    } finally {
      setForceDeleting(false);
    }
  };

  const filtered = search
    ? stockItems.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : stockItems;

  return (
    <div className="w-full space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <Button size="sm" className="gap-1.5 shrink-0" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5" />
          New Item
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-auto border rounded-md" style={{ maxHeight: "calc(100vh - 16rem)" }}>
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
            {filtered.length > 0 ? filtered.map((item) => (
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
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-sky-500 hover:text-sky-600 hover:bg-sky-50"
                      onClick={() => openEdit(item)}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(item._id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                      onClick={() => { setForceDeleteItem(item); setForceDeleteInput(""); }}
                      title="Force delete (removes all transactions)"
                    >
                      <Flame className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                  {search ? "No items match your search" : "No items yet"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Item" : "New Item"}</DialogTitle>
          </DialogHeader>
          <form id="item-form" onSubmit={handleSave} noValidate>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="item-name" className="text-sm">Name</Label>
                <input
                  id="item-name"
                  ref={nameRef}
                  autoFocus
                  type="text"
                  placeholder="e.g. Rice"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                  className={`${inputClass} w-full ${errors.name ? "border-red-500" : ""}`}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="item-unit" className="text-sm">Unit</Label>
                  <select
                    id="item-unit"
                    value={unit}
                    onChange={(e) => { setUnit(e.target.value); if (errors.unit) setErrors((p) => ({ ...p, unit: undefined })); }}
                    className={`${inputClass} w-full ${errors.unit ? "border-red-500" : ""}`}
                  >
                    <option value="" disabled>Select unit</option>
                    {units.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  {errors.unit && <p className="text-xs text-red-500">{errors.unit}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="item-category" className="text-sm">Category</Label>
                  <select
                    id="item-category"
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); if (errors.category) setErrors((p) => ({ ...p, category: undefined })); }}
                    className={`${inputClass} w-full ${errors.category ? "border-red-500" : ""}`}
                  >
                    <option value="" disabled>Select category</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
                </div>
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={closeModal} disabled={saving}>Cancel</Button>
            <Button type="submit" form="item-form" size="sm" disabled={saving}>
              {saving ? (editItem ? "Saving…" : "Adding…") : (editItem ? "Save changes" : "Add item")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force-delete confirmation dialog */}
      <Dialog
        open={!!forceDeleteItem}
        onOpenChange={(open) => { if (!open) { setForceDeleteItem(null); setForceDeleteInput(""); } }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Flame className="h-4 w-4" />
              Force Delete Item
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-muted-foreground">
            <p>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">{forceDeleteItem?.name}</span>{" "}
              along with <span className="font-semibold text-foreground">all its transactions and stock records</span>.
              Bills for affected dates will be recalculated.
            </p>
            <p className="text-destructive font-medium">This action cannot be undone.</p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Type <span className="font-semibold text-foreground">{forceDeleteItem?.name}</span> to confirm
              </Label>
              <input
                autoFocus
                type="text"
                value={forceDeleteInput}
                onChange={(e) => setForceDeleteInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && forceDeleteInput.trim() === forceDeleteItem?.name) handleForceDelete(); }}
                placeholder={forceDeleteItem?.name}
                className={inputClass + " w-full"}
              />
            </div>
          </div>
          <DialogFooter className="flex-row justify-end gap-2 sm:gap-2">
            <Button
              variant="outline" size="sm" className="min-w-20"
              onClick={() => { setForceDeleteItem(null); setForceDeleteInput(""); }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive" size="sm" className="min-w-20 gap-1.5"
              disabled={forceDeleteInput.trim() !== forceDeleteItem?.name || forceDeleting}
              onClick={handleForceDelete}
            >
              <Flame className="h-3.5 w-3.5" />
              {forceDeleting ? "Deleting…" : "Force Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

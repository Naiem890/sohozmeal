import { Trash2, X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

const BulkActionBar = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onBulkDelete,
  onClearSelection,
}: BulkActionBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {selectedCount} of {totalCount} selected
        </span>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onSelectAll}>
          <CheckSquare className="h-3.5 w-3.5 mr-1" />
          {selectedCount === totalCount ? "Deselect All" : "Select All"}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="destructive"
          className="h-7"
          onClick={onBulkDelete}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Delete ({selectedCount})
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onClearSelection}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default BulkActionBar;

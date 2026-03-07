import { useState, useRef, useEffect } from "react";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:bg-muted disabled:cursor-not-allowed";

export const ItemSearchInput = ({ items, value, onChange, placeholder = "Search item...", disabled }) => {
  const [query, setQuery] = useState(value?.name || "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync query when value changes externally (e.g. row type change clears selection)
  useEffect(() => {
    setQuery(value?.name || "");
  }, [value?._id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        // Restore display to selected item name if user didn't pick anything
        setQuery(value?.name || "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filtered = query
    ? items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange(null); // clear selection when typing
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={cn(inputClass, "pl-8", value && "border-primary/50")}
        />
        {value && (
          <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary pointer-events-none" />
        )}
      </div>

      {open && (
        <div className="absolute z-[60] top-full left-0 min-w-full mt-1 bg-background border rounded-md shadow-lg max-h-52 overflow-auto">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item._id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(item);
                  setQuery(item.name);
                  setOpen(false);
                }}
                className={cn(
                  "px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-3 hover:bg-muted",
                  value?._id === item._id && "bg-primary/10 text-primary font-medium"
                )}
              >
                <span className="font-medium">{item.name}</span>
                <div className="flex items-center gap-2 flex-shrink-0 text-xs text-muted-foreground">
                  <span>{item.unit}</span>
                  {item.available != null && (
                    <span className="text-amber-600">({item.available?.toFixed(2)} left)</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-muted-foreground text-center">
              {query ? "No items match your search" : "No items available"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

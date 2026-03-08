import { useState, useRef, useEffect, forwardRef } from "react";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:bg-muted disabled:cursor-not-allowed";

export const ItemSearchInput = forwardRef(
  (
    {
      items,
      value,
      onChange,
      placeholder = "Search item...",
      disabled,
      onKeyDown: onExternalKeyDown,
    },
    ref
  ) => {
    const [query, setQuery] = useState(value?.name || "");
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
      setQuery(value?.name || "");
    }, [value?._id]);

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setOpen(false);
          setQuery(value?.name || "");
          setHighlightedIndex(-1);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [value]);

    // Reset highlight when query changes
    useEffect(() => {
      setHighlightedIndex(-1);
    }, [query]);

    // Scroll highlighted item into view
    useEffect(() => {
      if (highlightedIndex >= 0 && listRef.current) {
        const els = listRef.current.querySelectorAll("[data-option]");
        els[highlightedIndex]?.scrollIntoView({ block: "nearest" });
      }
    }, [highlightedIndex]);

    const filtered = query
      ? items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
      : items;

    const selectItem = (item) => {
      onChange(item);
      setQuery(item.name);
      setOpen(false);
      setHighlightedIndex(-1);
    };

    const handleKeyDown = (e) => {
      if (open) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightedIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Enter" && highlightedIndex >= 0) {
          e.preventDefault();
          selectItem(filtered[highlightedIndex]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setOpen(false);
          setQuery(value?.name || "");
          setHighlightedIndex(-1);
          return;
        }
      }
      // Pass unhandled keys (arrows when closed, etc.) to parent for field navigation
      onExternalKeyDown?.(e);
    };

    return (
      <div ref={containerRef} className="relative w-full">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            ref={ref}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              if (value) onChange(null);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
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
          <div
            ref={listRef}
            className="absolute z-[60] top-full left-0 min-w-full mt-1 bg-background border rounded-md shadow-lg max-h-52 overflow-auto"
          >
            {filtered.length > 0 ? (
              filtered.map((item, idx) => (
                <div
                  key={item._id}
                  data-option
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectItem(item);
                  }}
                  className={cn(
                    "px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-3 hover:bg-muted",
                    value?._id === item._id && "bg-primary/10 text-primary font-medium",
                    highlightedIndex === idx && "bg-muted ring-1 ring-inset ring-primary/20"
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
  }
);
ItemSearchInput.displayName = "ItemSearchInput";

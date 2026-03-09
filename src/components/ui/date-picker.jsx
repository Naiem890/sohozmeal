import * as React from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ── helpers ───────────────────────────────────────────────────────────────────

function toDate(value) {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "string") return parseISO(value); // "YYYY-MM-DD" → local Date
  return undefined;
}

// ── DatePicker ────────────────────────────────────────────────────────────────
// Single-day picker. Accepts a Date or "YYYY-MM-DD" string for `value`.
// `onChange` is called with a Date object.
// ForwardRef goes to the trigger button so callers can call .focus() on it.
// Any extra props (e.g. `onKeyDown`) are forwarded to the trigger button.

const DatePicker = React.forwardRef(function DatePicker(
  {
    value,
    onChange,
    placeholder = "Pick a date",
    disabled,
    max,
    min,
    className,
    align = "start",
    ...triggerProps
  },
  ref
) {
  const [open, setOpen] = React.useState(false);

  const date = toDate(value);
  const maxDate = toDate(max);
  const minDate = toDate(min);

  const handleSelect = (selected) => {
    if (selected) {
      onChange?.(selected);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal h-9 gap-2",
            !date && "text-muted-foreground",
            className
          )}
          {...triggerProps}
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
          {date ? format(date, "dd MMM yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          defaultMonth={date}
          disabled={(d) => {
            if (minDate && d < minDate) return true;
            if (maxDate && d > maxDate) return true;
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
});

// ── MonthYearPicker ───────────────────────────────────────────────────────────
// Month + year picker for monthly views (bills, expenses, etc.).
// `onChange` is called with a Date set to the 1st of the selected month.
// Defaults to blocking future months.

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function MonthYearPicker({ value, onChange, maxDate: maxDateProp, className }) {
  const [open, setOpen] = React.useState(false);
  const today = new Date();

  const maxDate = maxDateProp instanceof Date
    ? maxDateProp
    : new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const maxYear = maxDate.getFullYear();
  const maxMonth = maxDate.getMonth();

  const date = toDate(value);
  const [viewYear, setViewYear] = React.useState(date?.getFullYear() ?? today.getFullYear());

  const isDisabled = (mi) =>
    viewYear > maxYear || (viewYear === maxYear && mi > maxMonth);

  const isSelected = (mi) =>
    !!date && date.getFullYear() === viewYear && date.getMonth() === mi;

  const handleSelect = (mi) => {
    if (isDisabled(mi)) return;
    onChange?.(new Date(viewYear, mi, 1));
    setOpen(false);
  };

  const label = date
    ? date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Select month";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "justify-start text-left font-normal h-9 gap-2",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[216px] p-3" align="start">
        {/* Year navigation */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            type="button"
            onClick={() => setViewYear((y) => y - 1)}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold tabular-nums">{viewYear}</span>
          <button
            type="button"
            onClick={() => setViewYear((y) => y + 1)}
            disabled={viewYear >= maxYear}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1">
          {MONTH_LABELS.map((m, i) => {
            const disabled = isDisabled(i);
            const selected = isSelected(i);
            return (
              <button
                key={m}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(i)}
                className={cn(
                  "rounded-md py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : disabled
                    ? "text-muted-foreground/35 cursor-not-allowed"
                    : "hover:bg-muted text-foreground cursor-pointer"
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker, MonthYearPicker };

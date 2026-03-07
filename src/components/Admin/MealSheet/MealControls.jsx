import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Download, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const MealControls = ({
  fromDate,
  setFromDate,
  generateMeal,
  exportToExcel,
  formattedDate,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meal Sheet</h1>
        {formattedDate && (
          <p className="text-xs text-muted-foreground mt-0.5">{formattedDate}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-40 justify-start text-left font-normal",
                !fromDate && "text-muted-foreground"
              )}
            >
              <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
              {fromDate ? format(fromDate, "dd MMM yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={(date) => {
                if (date) {
                  setFromDate(date);
                  setOpen(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button size="sm" variant="outline" onClick={generateMeal}>
          <Utensils className="h-4 w-4" />
          Generate
        </Button>

        <Button size="icon" variant="outline" onClick={exportToExcel} title="Export to Excel">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

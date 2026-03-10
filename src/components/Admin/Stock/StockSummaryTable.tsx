import React from "react";
import { Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface StockEntry {
  _id?: string;
  item?: { name?: string; unit?: string };
  quantity?: number;
  price?: number;
  [key: string]: unknown;
}

interface StockSummaryTableProps {
  stocks: StockEntry[];
  summarySearch: string;
  setSummarySearch: (v: string) => void;
  onItemClick?: (item: unknown) => void;
}

export const StockSummaryTable = ({ stocks, summarySearch, setSummarySearch, onItemClick }: StockSummaryTableProps) => {
  const filtered = summarySearch
    ? stocks.filter((s: StockEntry) => s.item?.name?.toLowerCase().includes(summarySearch.toLowerCase()))
    : stocks;

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-base font-semibold">Stock Summary</h2>
        {onItemClick && (
          <span className="text-[10px] text-muted-foreground">Click row for history</span>
        )}
      </div>
      <div className="relative shrink-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search items..."
          value={summarySearch}
          onChange={(e) => setSummarySearch(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <div className="flex-1 overflow-auto min-h-0 border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Avg Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((stock: StockEntry) => (
                <TableRow
                  key={stock._id}
                  onClick={() => onItemClick?.(stock.item)}
                  className={onItemClick ? "cursor-pointer hover:bg-muted/60 transition-colors" : ""}
                >
                  <TableCell className="text-sm font-medium">{stock?.item?.name}</TableCell>
                  <TableCell className="text-sm">{stock?.quantity?.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{stock?.item?.unit}</TableCell>
                  <TableCell className="text-sm">{stock?.price?.toFixed(2)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">
                  {summarySearch ? "No items match your search" : "No stock data"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

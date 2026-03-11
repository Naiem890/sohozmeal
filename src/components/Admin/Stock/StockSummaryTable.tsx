import React from "react";
import { Search } from "lucide-react";

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
    <div className="flex flex-col gap-2 max-h-[calc(100vh-8rem)]">
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
      <div className="border rounded-md overflow-auto min-h-0 flex-1">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors">
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Qty</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Unit</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Avg Price</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {filtered.length > 0 ? (
              filtered.map((stock: StockEntry) => (
                <tr
                  key={stock._id}
                  onClick={() => onItemClick?.(stock.item)}
                  className={`border-b transition-colors hover:bg-muted/50${onItemClick ? " cursor-pointer" : ""}`}
                >
                  <td className="px-4 py-3 align-middle text-sm font-medium">{stock?.item?.name}</td>
                  <td className="px-4 py-3 align-middle text-sm">{stock?.quantity?.toFixed(2)}</td>
                  <td className="px-4 py-3 align-middle text-sm text-muted-foreground">{stock?.item?.unit}</td>
                  <td className="px-4 py-3 align-middle text-sm">{stock?.price?.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {summarySearch ? "No items match your search" : "No stock data"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import TransactionRow from "./TransactionRow";
import { ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "../../Common/Pagination";

interface TxRecord {
  _id: string;
  type: string;
  quantityChange: number;
  transactionAmount?: number;
  item?: { name?: string; unit?: string };
  meal?: string;
  date?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface PaginationInfo {
  totalPages: number;
  total: number;
}

interface TransactionTableProps {
  transactions: TxRecord[];
  sortOrder: string;
  toggleSortOrder: () => void;
  showEditModal: (record: TxRecord) => void;
  handleDelete: (record: TxRecord) => void;
  pagination: PaginationInfo;
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
}

const TransactionTable = ({
  transactions,
  sortOrder,
  toggleSortOrder,
  showEditModal,
  handleDelete,
  pagination,
  page,
  onPageChange,
  pageSize,
  onPageSizeChange,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: TransactionTableProps) => {
  const allSelected = transactions.length > 0 && selectedIds.size === transactions.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <Card className="mt-4">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={onSelectAll}
                  className="h-4 w-4 rounded border-gray-300 cursor-pointer accent-primary"
                />
              </TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Meal</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={toggleSortOrder}>
                <div className="flex items-center gap-1">
                  Date / Created
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{sortOrder === "ASC" ? "↑" : "↓"}</span>
                </div>
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                  No transactions found
                </td>
              </TableRow>
            ) : (
              transactions.map((record: TxRecord) => (
                <TransactionRow
                  key={record._id}
                  record={record}
                  showEditModal={showEditModal}
                  handleDelete={handleDelete}
                  isSelected={selectedIds.has(record._id)}
                  onToggleSelect={onToggleSelect}
                />
              ))
            )}
          </TableBody>
        </Table>

        <Pagination
          page={page}
          totalPages={pagination?.totalPages}
          total={pagination?.total}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </CardContent>
    </Card>
  );
};

export default TransactionTable;

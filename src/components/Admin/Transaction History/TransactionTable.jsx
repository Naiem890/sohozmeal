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
}) => {
  return (
    <Card className="mt-4">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Item</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Meal</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={toggleSortOrder}>
                <div className="flex items-center gap-1">
                  Date
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{sortOrder === "ASC" ? "↑" : "↓"}</span>
                </div>
              </TableHead>
              <TableHead>Created</TableHead>
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
              transactions.map((record) => (
                <TransactionRow
                  key={record._id}
                  record={record}
                  showEditModal={showEditModal}
                  handleDelete={handleDelete}
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

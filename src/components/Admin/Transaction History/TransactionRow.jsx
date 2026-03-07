import { Trash2 } from "lucide-react";
import { formatDateTime } from "../../../Utils/formatDateString";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TransactionRow = ({ record, showEditModal, handleDelete }) => {
  const { date, time } = formatDateTime(record.createdAt);
  return (
    <TableRow className="cursor-pointer hover:bg-muted/40" onClick={() => showEditModal(record)}>
      <TableCell className="font-medium text-primary">{record.item.name}</TableCell>
      <TableCell>{record.quantityChange} <span className="text-xs text-muted-foreground">{record.item.unit}</span></TableCell>
      <TableCell>
        <Badge variant={record.type === "IN" ? "success" : "secondary"}>{record.type}</Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground capitalize">{record.meal?.toLowerCase()}</TableCell>
      <TableCell className="font-medium">{record.transactionAmount.toFixed(2)} ৳</TableCell>
      <TableCell className="text-sm">{new Date(record.date).toLocaleDateString()}</TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{date} {time}</TableCell>
      <TableCell className="text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={(e) => { e.stopPropagation(); handleDelete(record); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default TransactionRow;

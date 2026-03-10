import { Trash2 } from "lucide-react";
import { formatDateTime } from "../../../Utils/formatDateString";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TxRecord {
  _id: string;
  type: string;
  quantityChange: number;
  unitPrice?: number;
  transactionAmount?: number;
  item?: { name?: string; unit?: string };
  meal?: string;
  date?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface TransactionRowProps {
  record: TxRecord;
  showEditModal: (record: TxRecord) => void;
  handleDelete: (record: TxRecord) => void;
}

const TransactionRow = ({ record, showEditModal, handleDelete }: TransactionRowProps) => {
  const { date, time } = formatDateTime(record.createdAt ?? "");
  return (
    <TableRow className="cursor-pointer hover:bg-muted/40" onClick={() => showEditModal(record)}>
      <TableCell className="font-medium text-primary">{record.item?.name}</TableCell>
      <TableCell>
        {Number.isInteger(record.quantityChange) ? record.quantityChange : record.quantityChange.toFixed(3).replace(/\.?0+$/, "")}
        {" "}<span className="text-xs text-muted-foreground">{record.item?.unit}</span>
      </TableCell>
      <TableCell>
        <Badge variant={record.type === "IN" ? "success" : "secondary"}>{record.type}</Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground capitalize">{record.meal?.toLowerCase()}</TableCell>
      <TableCell className="font-medium">
        {record.transactionAmount?.toFixed(2)} ৳
        {record.unitPrice != null && (
          <span className="ml-1 text-xs text-muted-foreground font-normal">
            ({record.unitPrice.toFixed(2)}/u)
          </span>
        )}
      </TableCell>
      <TableCell className="text-sm">{new Date(record.date ?? "").toLocaleDateString()}</TableCell>
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

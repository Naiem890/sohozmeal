import { TrashIcon } from "@heroicons/react/24/outline";
import { formatDateTime } from "../../../Utils/formatDateString";
const TransactionRow = ({ record, showEditModal, handleDelete }) => {
  const formattedDate = formatDateTime(record.createdAt);
  return (
    <tr
      className="hover:bg-gray-200 cursor-pointer"
      style={{ height: "40px" }}
      onClick={() => showEditModal(record)}
    >
      <td className="text-blue-500 py-1">{record.item.name}</td>
      <td className="text-blue-500 py-1">{record.quantityChange}</td>
      <td className="py-1">{record.type}</td>
      <td className="py-1">{record.meal}</td>
      <td className="py-1">{record.transactionAmount.toFixed(2)} ৳</td>
      <td className="py-1">{new Date(record.date).toLocaleDateString()}</td>
      <td>
        {formattedDate.date} {formattedDate.time}
      </td>
      <td className="py-1">
        <button
          title="Delete Account"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(record);
          }}
          className="text-red-700 bg-red-200 rounded-full p-3"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

export default TransactionRow;

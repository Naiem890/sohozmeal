import TransactionRow from "./TransactionRow";

const TransactionTable = ({
  transactions,
  sortOrder,
  toggleSortOrder,
  showEditModal,
  handleDelete,
}) => {
  return (
    <div className="w-full my-4">
      <table className="table w-full" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th className="w-1/7">Item Name</th>
            <th className="w-1/7">Quantity</th>
            <th className="w-1/7">Transaction Type</th>
            <th className="w-1/7">Meal</th>
            <th className="w-1/7">Transaction Amount</th>
            <th className="w-1/7 cursor-pointer" onClick={toggleSortOrder}>
              Date {sortOrder === "ASC" ? "↑" : "↓"}
            </th>
            <th className="w-1/7">Created</th>
            <th className="w-1/7">Actions</th>
          </tr>
        </thead>
        <tbody className="">
          {transactions.map((record) => (
            <TransactionRow
              key={record._id}
              record={record}
              showEditModal={showEditModal}
              handleDelete={handleDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;

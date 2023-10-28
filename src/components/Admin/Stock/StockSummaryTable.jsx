import React from "react";

export const StockSummaryTable = ({ stocks }) => {
  return (
    <div className="">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Stock Summary</h2>
      </div>
      <div className="overflow-x-auto max-h-screen px-1 mt-4">
        <table className="table table-sm table-hover w-full">
          <thead className="bg-white shadow-sm sticky top-0 border-0 h-12">
            <tr className="">
              <th className="uppercase">Name</th>
              <th className="uppercase">Quantity</th>
              <th>Unit</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr
                className=" hover:shadow-sm rounded-lg hover:bg-emerald-50 transition-all border-b-0"
                key={stock._id}
              >
                <td>{stock.item.name}</td>
                <td>{stock.quantity}</td>
                <td>{stock.item.unit}</td>
                <td>{stock.price}</td>
                {/* TODO: need to change the property name */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

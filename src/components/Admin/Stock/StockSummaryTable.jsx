import React from "react";

export const StockSummaryTable = ({ stockOutItem }) => {
  return (
    <div className="">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Stock Summary</h2>
      </div>
      <div className="overflow-x-auto max-h-96 mt-4">
        <table className="table table-sm table-hover w-full">
          <thead className="bg-white shadow-sm sticky top-0 border-0 h-12">
            <tr className="">
              <th className="uppercase">Name</th>
              <th className="uppercase">Quantity</th>
              <th className="uppercase">Unit</th>
              <th className="uppercase">Price</th>
            </tr>
          </thead>
          <tbody>
            {stockOutItem.map((stock) => (
              <tr
                className=" hover:shadow-sm rounded-lg hover:bg-emerald-50 transition-all border-b-0"
                key={stock._id}
              >
                <td className="text-base">{stock?.item?.name}</td>
                <td className="text-base">{stock?.quantity?.toFixed(2)}</td>
                <td className="text-base">{stock?.item?.unit}</td>
                <td className="text-base">{stock?.price?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

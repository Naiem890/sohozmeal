import React from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { fixedButtonClass } from "../../Utils/constant";
import { PlusIcon } from "@heroicons/react/24/outline";

const ExcelExport = ({ data, fileName }) => {
  const handleExport = () => {
    if (data.length === 0) return;

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create the title rows manually, starting from the fifth column (index 4)
    const title = Array(4)
      .fill("")
      .concat([`Osmany Hall (Male Wing) ${new Date().toLocaleDateString()}`]);
    const emptyRow = Array(20).fill(""); // Empty row spanning 20 columns

    // Extract column headings from data keys
    const columnHeadings = Object.keys(data[0]);

    // Construct the worksheet data
    const wsData = [
      emptyRow,
      title,
      emptyRow,
      columnHeadings,
      ...data.map((item) => Object.values(item)),
    ];

    // Create a worksheet with the data
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Merge the title row across columns E to T (index 4 to 19)
    worksheet["!merges"] = [
      { s: { r: 1, c: 4 }, e: { r: 1, c: 19 } }, // Merge E2:T2 (0-based index)
    ];

    // Set column widths to ensure the title spans across
    worksheet["!cols"] = Array(20).fill({ wpx: 100 });

    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${fileName}.xlsx`);
  };

  return (
    <div className="w-32">
      <button
        onClick={handleExport}
        className={`${fixedButtonClass} btn-sm h-auto basis-40 py-2 px-2`}
      >
        Export Sheet
      </button>
    </div>
  );
};

export default ExcelExport;

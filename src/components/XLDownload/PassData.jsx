import React from "react";
import ExcelExport from "./ExcelExport";

const data = [
  { name: "Johson", amount: 30000, sex: "M", is_married: true },
  { name: "Monika", amount: 355000, sex: "F", is_married: false },
  { name: "John", amount: 250000, sex: "M", is_married: false },
  { name: "Josef", amount: 450500, sex: "M", is_married: true },
];

const PassData = () => {
  return (
    <div>
      <ExcelExport data={data} fileName="EmployeeData" />
    </div>
  );
};

export default PassData;

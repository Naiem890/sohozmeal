import React from "react";
import DatePicker from "react-datepicker";

export default function DatePickerComponent({ selectedDate, onDateChange }) {
  const today = new Date();

  // Calculate the end of the current month
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return (
    <DatePicker
      selected={selectedDate}
      onChange={onDateChange}
      dateFormat="MM/yyyy"
      showMonthYearPicker
      maxDate={maxDate}
      className="focus:ring-1 focus:ring-emerald-500 rounded-lg text-sm z-50"
    />
  );
}

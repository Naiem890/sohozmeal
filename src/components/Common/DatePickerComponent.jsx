import React from "react";
import DatePicker from "react-datepicker";

export default function DatePickerComponent({ selectedDate, onDateChange }){
  const today = new Date();
  
  // Calculate the end of the current month
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return (
    <DatePicker
      selected={selectedDate}
      onChange={onDateChange}
      dateFormat="MM/yyyy"
      showMonthYearPicker
      maxDate={maxDate}  // Prevent selection beyond the current month
      className="rounded-md border-2 border-gray-300 focus:outline-none focus:border-blue-500 transition-all duration-300 ease-in-out text-xs p-2 md:p-3 max-w-full"
      wrapperClassName="w-full"
      calendarClassName="mt-2 rounded-md border-2 border-gray-300 shadow-lg bg-white text-gray-800"
    />
  );
}
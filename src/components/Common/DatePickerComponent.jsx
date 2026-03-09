import { MonthYearPicker } from "@/components/ui/date-picker";

export default function DatePickerComponent({ selectedDate, onDateChange }) {
  const today = new Date();
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return (
    <MonthYearPicker
      value={selectedDate}
      onChange={onDateChange}
      maxDate={maxDate}
    />
  );
}

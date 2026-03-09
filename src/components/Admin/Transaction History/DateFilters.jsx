import { DatePicker } from "@/components/ui/date-picker";

const DateFilters = ({ fromDate, toDate, setFromDate, setToDate }) => {
  return (
    <div className="flex gap-2">
      <DatePicker
        value={fromDate}
        onChange={setFromDate}
        placeholder="From date"
        max={toDate || new Date()}
        className="w-36"
      />
      <DatePicker
        value={toDate}
        onChange={setToDate}
        placeholder="To date"
        min={fromDate}
        max={new Date()}
        className="w-36"
      />
    </div>
  );
};

export default DateFilters;

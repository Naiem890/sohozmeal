import DatePicker from "react-datepicker";

const DateFilters = ({ fromDate, toDate, setFromDate, setToDate }) => {
  const inputClass =
    "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-32";

  return (
    <div className="flex gap-2">
      <DatePicker selected={fromDate} onChange={setFromDate} className={inputClass} />
      <DatePicker selected={toDate} onChange={setToDate} className={inputClass} />
    </div>
  );
};

export default DateFilters;

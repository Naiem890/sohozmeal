import DatePicker from "react-datepicker";

const DateFilters = ({ fromDate, toDate, setFromDate, setToDate }) => {
  return (
    <div className="flex gap-2 z-20">
      <div className="form-control">
        <DatePicker
          selected={fromDate}
          onChange={(date) => setFromDate(date)}
          className="focus:ring-1 focus:ring-emerald-500 rounded-lg text-sm"
        />
      </div>
      <div className="form-control z-20">
        <DatePicker
          selected={toDate}
          onChange={(date) => setToDate(date)}
          className="focus:ring-1 focus:ring-emerald-500 rounded-lg text-sm"
        />
      </div>
    </div>
  );
};

export default DateFilters;

import DatePicker from "react-datepicker";

const DateFilters = ({ fromDate, toDate, setFromDate, setToDate }) => {
  return (
    <div className="flex gap-2 z-20">
      <div className="form-control">
        <DatePicker
          selected={fromDate}
          onChange={(date) => setFromDate(date)}
          className="w-full rounded-lg border-0 h-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
        />
      </div>
      <div className="form-control z-20">
        <DatePicker
          selected={toDate}
          onChange={(date) => setToDate(date)}
          className="w-full rounded-lg border-0 h-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
        />
      </div>
    </div>
  );
};

export default DateFilters;

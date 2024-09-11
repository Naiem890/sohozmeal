import { fixedInputClass, RESIDENCES } from "../../../Utils/constant";

export const MealStats = ({
  gender,
  setGender,
  residence,
  setResidence,
  search,
  setSearch,
  breakfastCount,
  lunchCount,
  dinnerCount,
}) => {
  return (
    <div className="flex gap-4 my-2 justify-between">
      {/* Meal Counts */}
      <div className="flex gap-2">
        <h3 className="text-md font-bold bg-gray-100 px-4 py-2 text-gray-400 rounded-lg">
          B: {breakfastCount}
        </h3>
        <h3 className="text-md font-bold bg-gray-100 px-4 py-2 text-gray-400 rounded-lg">
          L: {lunchCount}
        </h3>
        <h3 className="text-md font-bold bg-gray-100 px-4 py-2 text-gray-400 rounded-lg">
          D: {dinnerCount}
        </h3>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className={`${fixedInputClass} h-auto w-36 cursor-pointer`}
        >
          <option selected value="">
            Gender
          </option>
          <option value="MALE">MALE</option>
          <option value="FEMALE">FEMALE</option>
        </select>
        <select
          value={residence}
          onChange={(e) => setResidence(e.target.value)}
          className={`${fixedInputClass} h-auto cursor-pointer`}
        >
          <option value="">All Residence</option>
          {RESIDENCES.map((res) => (
            <option key={res} value={res} className="font-thin text-sm">
              {res}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Name, Roll, Hall ID"
          className="rounded-lg border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
        />
      </div>
    </div>
  );
};

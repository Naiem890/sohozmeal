import React from 'react';
import Select from 'react-select';

const TableFilters = ({ 
  bloodGroups, 
  selectedBloodGroup, 
  setSelectedBloodGroup,
  searchTerm,
  setSearchTerm 
}) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-1/3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Blood Group
        </label>
        <Select
          isClearable
          value={selectedBloodGroup}
          onChange={setSelectedBloodGroup}
          options={bloodGroups}
          className="basic-select"
          classNamePrefix="select"
          placeholder="Select Blood Group"
        />
      </div>
      
      <div className="w-full md:w-1/3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search Donors
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or phone number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    </div>
  );
};

export default TableFilters;
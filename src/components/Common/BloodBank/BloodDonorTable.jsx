import React, { useState } from "react";
import TableFilters from "./TableFilters";
import DonorList from "./DonorList";

const BloodDonorTable = ({ donorData }) => {
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const bloodGroups = Object.keys(donorData).map((group) => ({
    value: group,
    label: group,
  }));

  const filteredData = selectedBloodGroup
    ? { [selectedBloodGroup.value]: donorData[selectedBloodGroup.value] }
    : donorData;

  return (
    <div className="pt-2">
      <TableFilters
        bloodGroups={bloodGroups}
        selectedBloodGroup={selectedBloodGroup}
        setSelectedBloodGroup={setSelectedBloodGroup}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <div className="">
        <DonorList donorData={filteredData} searchTerm={searchTerm} />
      </div>
    </div>
  );
};

export default BloodDonorTable;

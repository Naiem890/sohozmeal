import { useState } from "react";
import { format } from "date-fns";
import type { BloodGroup } from "@/types";

interface DonorEntry {
  name: string;
  phoneNumber: string;
  lastDonationDate?: string;
  residence?: string;
  roomNo?: string;
}

interface DonorData {
  donors: DonorEntry[];
}

interface DonorListProps {
  donorData: Record<BloodGroup, DonorData>;
  searchTerm: string;
}

interface DonorMobileCardProps {
  donor: DonorEntry;
  bloodGroup: string;
}

const DonorList = ({ donorData, searchTerm }: DonorListProps) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const filterDonors = (donors: DonorEntry[]) => {
    return donors.filter(
      (donor) =>
        donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donor.phoneNumber.includes(searchTerm)
    );
  };

  const DonorMobileCard = ({ donor, bloodGroup }: DonorMobileCardProps) => (
    <div className="bg-white shadow-sm rounded-lg p-4 mb-2 border border-gray-200">
      <div className="flex justify-between items-center mb-2"></div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div>
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            {bloodGroup}
          </span>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-900">{donor.name}</span>
        </div>
        <div>
          <strong>Phone:</strong> {donor.phoneNumber}
        </div>
        <div>
          <strong>Last Donation:</strong>{" "}
          {donor.lastDonationDate
            ? format(new Date(donor.lastDonationDate), "MMM dd, yyyy")
            : "N/A"}
        </div>
        <div>
          <strong>Residence:</strong> {donor.residence?.replace("_", " ")}
        </div>
        <div>
          <strong>Room No:</strong> {donor.roomNo}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block max-h-[30rem]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Blood Group", "Name", "Phone Number", "Last Donation", "Residence", "Room No"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(donorData).map(([bloodGroup, data]) =>
              filterDonors(data.donors).map((donor, index) => (
                <tr key={`${bloodGroup}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      {bloodGroup}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {donor.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {donor.phoneNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {donor.lastDonationDate
                      ? format(new Date(donor.lastDonationDate), "MMM dd, yyyy")
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {donor.residence?.replace("_", " ")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {donor.roomNo}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {Object.entries(donorData).map(([bloodGroup, data]) => {
          const filteredDonors = filterDonors(data.donors);
          if (filteredDonors.length === 0) return null;
          return (
            <div key={bloodGroup} className="mb-4">
              <div
                className="flex justify-between items-center bg-gray-100 p-3 rounded-t-lg cursor-pointer"
                onClick={() =>
                  setExpandedGroup(expandedGroup === bloodGroup ? null : bloodGroup)
                }
              >
                <span className="font-semibold text-gray-700">{bloodGroup} Donors</span>
                <span className="text-sm text-gray-500">
                  {filteredDonors.length} Donor{filteredDonors.length !== 1 ? "s" : ""}
                </span>
              </div>
              {expandedGroup === bloodGroup && (
                <div>
                  {filteredDonors.map((donor, index) => (
                    <DonorMobileCard
                      key={`mobile-${bloodGroup}-${index}`}
                      donor={donor}
                      bloodGroup={bloodGroup}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DonorList;

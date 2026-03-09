import BloodDonorTable from "./BloodDonorTable";

// Legacy wrapper kept for compatibility. Prefer using BloodDonorTable directly with `wing` prop.
const TableComponent = ({ donorData = {}, wing, showWing = false }) => {
  // If wing is provided use it directly; otherwise derive from donorData keys (legacy).
  const resolvedWing = wing || (Object.keys(donorData)[0] ? "MALE" : undefined);
  return (
    <div className="pt-2">
      <h2 className="text-lg font-semibold mb-3">Donor List</h2>
      <BloodDonorTable wing={resolvedWing} showWing={showWing} />
    </div>
  );
};

export default TableComponent;

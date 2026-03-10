import BloodDonorTable from "./BloodDonorTable";
import type { Wing } from "@/types";

interface TableComponentProps {
  donorData?: Record<string, unknown>;
  wing?: Exclude<Wing, "ALL">;
  showWing?: boolean;
}

// Legacy wrapper kept for compatibility. Prefer using BloodDonorTable directly with `wing` prop.
const TableComponent = ({ donorData = {}, wing, showWing = false }: TableComponentProps) => {
  const resolvedWing = wing || (Object.keys(donorData)[0] ? "MALE" : undefined);
  return (
    <div className="pt-2">
      <h2 className="text-lg font-semibold mb-3">Donor List</h2>
      <BloodDonorTable wing={resolvedWing} showWing={showWing} />
    </div>
  );
};

export default TableComponent;

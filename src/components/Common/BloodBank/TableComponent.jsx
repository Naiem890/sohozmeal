import BloodDonorTable from "./BloodDonorTable";

const TableComponent = ({ donorData }) => {
  return (
    <div className="mx-auto pb-8 pt-2">
      <h1 className="text-2xl font-bold">Donor List</h1>
      <BloodDonorTable donorData={donorData} />
    </div>
  );
};

export default TableComponent;

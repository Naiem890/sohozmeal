import React, { useState, useEffect } from "react";

const EditTransactionModal = ({
  visible,
  record,
  handleSave,
  handleCancel,
}) => {
  const [formData, setFormData] = useState(record);
  const [errors, setErrors] = useState({});
  const [pricePerUnit, setPricePerUnit] = useState(
    record.transactionAmount / record.quantityChange || "0"
  );

  // Update formData whenever a new record is passed
  useEffect(() => {
    if (record) {
      setFormData(record);
      setPricePerUnit(record.transactionAmount / record.quantityChange);
    }
  }, [record]);

  // Validation function for quantity and transaction amount
  const validate = () => {
    const newErrors = {};
    if (formData.quantityChange <= 0) {
      newErrors.quantityChange = "Quantity must be greater than zero";
    }
    if (formData.type === "IN" && pricePerUnit <= 0) {
      newErrors.pricePerUnit = "Price per unit must be greater than zero";
    }
    if (formData.type === "OUT" && pricePerUnit < 0) {
      newErrors.pricePerUnit = "Price per unit must be valid";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let convertedValue = value;

    // Prevent NaN by handling empty values
    if (type === "number") {
      convertedValue = value === "" ? "" : parseFloat(value); // Ensure float parsing
    }

    setFormData({ ...formData, [name]: convertedValue });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      formData.transactionAmount = pricePerUnit * formData.quantityChange;
      formData.pricePerUnit = pricePerUnit;
      console.log(formData, "hii");
      handleSave(formData);
    }
  };

  return (
    visible && (
      <div className="modal modal-open">
        <div className="modal-box rounded-xl">
          <h2 className="text-xl font-bold mb-4">Edit Transaction</h2>
          <form onSubmit={handleFormSubmit}>
            <div className="form-control">
              <label className="label">Item Name</label>
              <input
                name="itemName"
                value={formData?.item?.name || ""} // Ensure item name is handled properly
                disabled={true} // Disable item name input
                className="input input-bordered"
              />
            </div>
            <div className="form-control">
              <label className="label">Quantity Change</label>
              <input
                type="number"
                name="quantityChange"
                step="any"
                value={formData.quantityChange || ""} // Handle empty value
                onChange={handleChange}
                className="input input-bordered"
                min="0"
                required
              />
              {errors.quantityChange && (
                <span className="text-red-500">{errors.quantityChange}</span>
              )}
            </div>
            <div className="form-control">
              <label className="label">Transaction Type</label>
              <select
                name="type"
                value={formData.type}
                className="select select-bordered"
                disabled={true}
              >
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>
            </div>
            {console.log(formData.item.category, "skd")}
            {formData?.type !== "IN" && (
              <div className="form-control">
                <label className="label">Meal</label>
                <select
                  name="meal"
                  value={formData.meal}
                  onChange={handleChange}
                  className="select select-bordered"
                  required
                >
                  <option value="BREAKFAST">BREAKFAST</option>
                  <option value="LUNCH">LUNCH</option>
                  <option value="DINNER">DINNER</option>
                </select>
              </div>
            )}
            {/* Conditionally show the Unit Price field based on transaction type and item category */}
            {(formData?.item?.category === "NON_STORED" ||
              formData.type === "IN") && (
              <div className="form-control">
                <label className="label">Unit Price</label>
                <input
                  type="number"
                  step="any" // Allow decimals with step
                  name="pricePerUnit"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  className="input input-bordered"
                  min="0"
                  required={formData.type === "IN"} // Required for IN transactions
                  disabled={
                    formData.type === "OUT" &&
                    formData?.item?.category === "STORED"
                  } // Disable for OUT transactions of STORED items
                />
                {errors.pricePerUnit && (
                  <span className="text-red-500">{errors.pricePerUnit}</span>
                )}
              </div>
            )}
            <div className="modal-action">
              <button
                type="submit"
                className="btn bg-emerald-600 text-white rounded-lg btn-md hover:bg-emerald-500"
              >
                Save
              </button>
              <button
                type="button"
                className="btn btn-ghost rounded-lg btn-md"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );
};

export default EditTransactionModal;

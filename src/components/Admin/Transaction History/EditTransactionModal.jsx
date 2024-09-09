import React, { useState, useEffect } from "react";

const EditTransactionModal = ({
  visible,
  record,
  handleSave,
  handleCancel,
}) => {
  const [formData, setFormData] = useState(record);
  const [errors, setErrors] = useState({});

  // Update formData whenever a new record is passed
  useEffect(() => {
    setFormData(record);
  }, [record]);

  // Validation function for quantity and transaction amount
  const validate = () => {
    const newErrors = {};
    if (formData.quantityChange <= 0) {
      newErrors.quantityChange = "Quantity must be greater than zero";
    }
    if (formData.type === "IN" && formData.transactionAmount <= 0) {
      newErrors.transactionAmount =
        "Transaction amount must be greater than zero";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    let convertedValue = value;

    // Prevent NaN by handling empty values
    if (type === "number" || name === "transactionAmount") {
      convertedValue = value === "" ? "" : parseFloat(value); // Ensure float parsing
    } else {
      convertedValue = value;
    }

    setFormData({ ...formData, [name]: convertedValue });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
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
                value={formData.item.name}
                disabled={true} // Disable item name input
                className="input input-bordered"
              />
            </div>
            <div className="form-control">
              <label className="label">Quantity Change</label>
              <input
                type="number"
                name="quantityChange"
                value={formData.quantityChange || ""} // Handle empty value
                onChange={handleChange}
                className="input input-bordered"
                min="1"
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
            {formData.type === "IN" && (
              <div className="form-control">
                <label className="label">Transaction Amount</label>
                <input
                  type="number"
                  step="0.01" // Allow decimals with step
                  name="transactionAmount"
                  value={formData.transactionAmount || ""} // Handle empty value
                  onChange={handleChange}
                  className="input input-bordered"
                  min="1"
                  required
                />
                {errors.transactionAmount && (
                  <span className="text-red-500">
                    {errors.transactionAmount}
                  </span>
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

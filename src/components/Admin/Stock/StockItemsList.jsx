import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { fixedButtonClass, fixedInputClass } from "../../../Utils/constant";
import { Axios } from "../../../api/api";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export const StockItemsList = ({
  stockItems,
  units,
  categories,
  refetchHandler,
  wing,
}) => {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [editItemId, setEditItemId] = useState(null);

  const handleAddItem = async (e) => {
    e.preventDefault();

    try {
      const result = await Axios.post("/stock/item", {
        item: {
          name,
          unit,
          category,
          wing,
        },
      });
      toast.success("Item added successfully!");
      refetchHandler();
      reset();
    } catch (error) {
      console.error("Error while adding item:", error);
      toast.error(error.response.data.error);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();

    try {
      const result = await Axios.put(`/stock/item/${editItemId}`, {
        item: {
          name,
          unit,
          category,
          wing,
        },
      });
      toast.success("Item updated successfully!");
      refetchHandler();
      reset();
      setEditItemId("");
    } catch (error) {
      console.error("Error while updating item:", error);
      toast.error(error.response.data.error);
    }
  };

  const reset = () => {
    setEditItemId("");
    setName("");
    setUnit("");
    setCategory("");
  };

  const handleDeleteStockItem = async (id) => {
    const confirmation = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirmation.isConfirmed) {
      try {
        const res = await Axios.delete(`/stock/item/${id}?wing=${wing}`);
        toast.success(res.data.message);
        refetchHandler();
      } catch (error) {
        console.log(error);
        toast.error(error.response.data.error);
      }
    }
  };

  return (
    <div className="w-full max-w-max ">
      <div className="overflow-x-auto max-h-64 px-1 mt-4">
        <table className="table table-xs table-hover w-auto max-w-max">
          <thead className="bg-white">
            <tr className="border-b-0">
              <th className="uppercase">Name</th>
              <th className="uppercase">Unit</th>
              <th className="uppercase">Category</th>
              <th className="uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stockItems.map((item) => (
              <tr
                className="hover:shadow-sm rounded-lg hover:bg-neutral-100 transition-all border-b-0"
                key={item._id}
              >
                <td>{item.name}</td>
                <td>{item.unit}</td>
                <td>
                  <div
                    className={`badge badge-outline !text-xs ${
                      item.category === "STORED"
                        ? "badge-success"
                        : "badge-info"
                    }`}
                  >
                    {item.category}
                  </div>
                </td>

                <td className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setEditItemId(item._id);
                      setName(item.name);
                      setUnit(item.unit);
                      setCategory(item.category);
                    }}
                    title="Edit"
                    className="text-sky-500 bg-sky-100 rounded-full p-1"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    title="Delete"
                    onClick={() => handleDeleteStockItem(item._id)}
                    className="text-red-700 bg-red-200 rounded-full p-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form
        onSubmit={editItemId ? handleUpdateItem : handleAddItem}
        className="max-w-max mt-4"
      >
        <div className="flex flex-wrap gap-2">
          <div className="w-32">
            <label className="block text-sm font-medium leading-6 text-gray-600">
              Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${fixedInputClass} !text-xs h-9 mt-2 w-full`}
            />
          </div>

          <div className="w-24">
            <label className="block text-sm font-medium leading-6 text-gray-600">
              Unit
            </label>
            <select
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              name="unit"
              className={`${fixedInputClass} !text-xs h-9 mt-2 w-full`}
            >
              <option value="" disabled selected>
                Unit
              </option>
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div className="w-36">
            <label className="block text-sm font-medium leading-6 text-gray-600">
              Category
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              name="category"
              className={`${fixedInputClass} !text-xs h-9 mt-2 w-full`}
            >
              <option value="" disabled selected>
                Category
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="justify-end items-end self-end">
            {editItemId && (
              <button
                title="Cancel"
                onClick={reset}
                className={`${fixedButtonClass} bg-neutral-200 !text-neutral-700 hover:bg-neutral-300 btn-xs sm:w-16 !h-9`}
              >
                Close
              </button>
            )}
            <button
              type="submit"
              className={`${fixedButtonClass} btn-xs sm:w-20 !h-9`}
            >
              {editItemId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

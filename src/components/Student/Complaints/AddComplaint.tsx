import React, { useState } from "react";

const AddComplaint = () => {
  const [formData, setFormData] = useState({
    title: "",
    currentRoomNo: "",
    complaintType: "",
    description: "",
    residence: "",
    images: [] as string[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const totalImages = formData.images.length + files.length;

    if (totalImages > 4) {
      alert("You can upload a maximum of 4 images.");
      return;
    }

    const imagePreviews = files.map((file) => {
      const reader = new FileReader();
      return new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file as Blob);
      });
    });

    Promise.all(imagePreviews).then((previews) => {
      setFormData((prevData) => ({
        ...prevData,
        images: [...prevData.images, ...previews],
      }));
    });
  };

  const handleImageRemove = (index: number) => {
    setFormData((prevData) => ({
      ...prevData,
      images: prevData.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clear the form after submission
    setFormData({
      title: "",
      currentRoomNo: "",
      complaintType: "",
      description: "",
      residence: "",
      images: [],
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-6">Add New Complaint</h1>
      <form onSubmit={handleSubmit} className="grid gap-4">
        {/* Title */}
        <div>
          <label className="block mb-1 font-semibold" htmlFor="title">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter the complaint title"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          />
        </div>

        {/* Room Number */}
        <div>
          <label className="block mb-1 font-semibold" htmlFor="currentRoomNo">
            Room Number
          </label>
          <input
            type="text"
            id="currentRoomNo"
            name="currentRoomNo"
            value={formData.currentRoomNo}
            onChange={handleChange}
            placeholder="Enter your room number"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          />
        </div>

        {/* Complaint Type */}
        <div>
          <label className="block mb-1 font-semibold" htmlFor="complaintType">
            Complaint Type
          </label>
          <select
            id="complaintType"
            name="complaintType"
            value={formData.complaintType}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          >
            <option value="" disabled>
              Select type
            </option>
            <option value="MESS">Mess</option>
            <option value="WIFI">WiFi</option>
            <option value="CLEANING">Cleaning</option>
            <option value="REPAIR">Repair</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Residence */}
        <div>
          <label className="block mb-1 font-semibold" htmlFor="residence">
            Residence
          </label>
          <select
            id="residence"
            name="residence"
            value={formData.residence}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          >
            <option value="" disabled>
              Select residence
            </option>
            <option value="OSMANY_HALL">Osmany Hall</option>
            <option value="EXT_D">EXT D</option>
            <option value="FEMALE_WING">Female Wing</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 font-semibold" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the issue"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            rows={4}
            required
          ></textarea>
        </div>

        {/* Images */}
        <div>
          <label className="block mb-1 font-semibold" htmlFor="images">
            Upload Images (Max 4)
          </label>
          <input
            type="file"
            id="images"
            name="images"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium cursor-pointer"
          />
          {/* Preview Images */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white text-xs px-1.5 py-0.5 rounded"
                  onClick={() => handleImageRemove(index)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium text-sm transition-colors">
            Submit Complaint
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddComplaint;

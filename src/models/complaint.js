const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    // 1. Title of the complaint
    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    // 2. Reference to the complaining student
    complainedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "ComplainedBy field is required"],
    },
    // 3. Room number of the complainant
    currentRoomNo: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
      maxlength: [10, "Room number cannot exceed 10 characters"],
    },
    // 4. Complaint type
    complaintType: {
      type: String,
      required: [true, "Complaint type is required"],
      enum: {
        values: ["MESS", "WIFI", "CLEANING", "REPAIR", "OTHER"],
        message: "Complaint type must be MESS, WIFI, CLEANING, REPAIR, or OTHER",
      },
    },
    // 5. Description of the complaint
    description: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    // 6. Complaint status
    status: {
      type: String,
      enum: {
        values: ["PENDING", "COMPLETED"],
        message: "Status must be PENDING or COMPLETED",
      },
      default: "PENDING",
    },
    // 7. Admin confirmation
    adminConfirmed: {
      type: Boolean,
      default: false,
    },
    // 8. Admin message
    adminMessage: {
      type: String,
      trim: true,
      maxlength: [500, "Admin message cannot exceed 500 characters"],
    },
    // 9. Student confirmation
    studentConfirmed: {
      type: Boolean,
      default: false,
    },
    // 10. Residence type
    residence: {
      type: String,
      required: [true, "Residence is required"],
      enum: {
        values: ["OSMANY_HALL", "EXT_D", "FEMALE_WING"],
        message: "Residence must be OSMANY_HALL, EXT_D, or FEMALE_WING",
      },
    },
    // 11. Images array with max 4 images
    images: {
      type: [
        {
          url: {
            type: String,
            required: [true, "Image URL is required"],
            match: [
              /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/,
              "Image URL must be a valid URL ending with .jpg, .jpeg, .png, .webp, or .gif",
            ],
          },
        },
      ],
      validate: [
        {
          validator: function (value) {
            return value.length <= 4;
          },
          message: "A maximum of 4 images is allowed",
        },
      ],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;

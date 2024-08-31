const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tuitionType: { type: String, required: true },
  city: { type: mongoose.Schema.Types.ObjectId, ref: "City", required: true },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    required: true,
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  subjects: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  ],
  studentGender: { type: String },
  tutorGender: { type: String },
  numStudents: { type: String },
  days: [{ type: mongoose.Schema.Types.ObjectId, ref: "Day", required: true }],
  salary: { type: String, required: true },
  otherRequirement: { type: String },


  // New postedDate field
  postedDate: {
    type: Date,
    required: true,
    default: Date.now, // Automatically set to the current date when created
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now, // Automatically set to the current date when created
  },

  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Booking", BookingSchema);

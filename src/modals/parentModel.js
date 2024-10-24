const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const parentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  whatsAppNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    // required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  city: {
    type: Schema.Types.ObjectId,
    ref: "City",
    required: true,
  },
  pinCode: {
    type: Schema.Types.ObjectId,
    ref: "Pincode",
    required: true,
  },
  schoolName: {
    type: String,
  },
  board: String,
  medium: String,
  guardianName: {
    type: String,
    // required: true,
  },
  guardianContact: {
    type: String,
    // required: true,
  },

  guardianRelation: {
    type: String,
    // required: true,
  },
  address: String,
});

const Parent = mongoose.model("Parent", parentSchema);
module.exports = Parent;

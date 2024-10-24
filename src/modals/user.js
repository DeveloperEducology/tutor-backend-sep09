const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
  type: { type: String, enum: ["image", "video"], required: false },
  url: { type: String, required: true },
});

// User schema definition
const userSchema = new mongoose.Schema({
  profileImage: {
    type: String,
    default:
      "https://t3.ftcdn.net/jpg/03/64/62/36/360_F_364623623_ERzQYfO4HHHyawYkJ16tREsizLyvcaeg.jpg",
  },
  userName: {
    type: String,
    // required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    // required: true,
  },
  password: {
    type: String,
    // required: true,
  },
  
  links: {
    type: Array,
    default: [],
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
city: { type: mongoose.Schema.Types.ObjectId, ref: "City" },
  pincode: { type: mongoose.Schema.Types.ObjectId, ref: "Pincode" },
  fcmToken: {
    type: String,
    default: null,
  },
 isProfileVerified: {
    type: Boolean,
    default: false,
  },
  isNewUser: {
    type: Boolean,
    default: true,
  },
  token: {
    type: String,
    default: null,
  },


  hasProfile: {
    type: Boolean,
    default: false,
  },
  userType: {
    type: String,
    required: true,
    // default: "tutor",
  },
  createdAt: {
    type: Date,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");

const user_schema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
  },
  lname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: [String],
    required: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

const userOtp = new mongoose.Schema({
  otp: {
    type: Number,
    required: true,
  },
  otpId: {
    type: String,
  },
  generatedAt: {
    type: Date,
  },
  expireAt: {
    type: Date,
  },
});

const userCollection = new mongoose.model("user_data", user_schema);
const otpCollection = new mongoose.model("user_otp", userOtp);

module.exports = { userCollection, otpCollection };

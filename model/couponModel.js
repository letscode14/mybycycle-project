const mongoose = require("mongoose");

// Define schema for coupons
const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  validFor: {
    type: String,
    required: true,
  },
  validTo: {
    type: Date,
    required: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  validityFrom: {
    type: Date,
    required: true,
  },
  minimumPurchaseAmount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a model for coupons
const couponCollection = new mongoose.model("coupon_datas", couponSchema);

module.exports = { couponCollection };

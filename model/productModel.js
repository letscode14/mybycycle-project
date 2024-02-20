const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  inStock: {
    type: Boolean,
    required: true,
    default: true,
  },
  category: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  description: {
    type: [String],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  color: {
    type: [String],
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  suspension: {
    type: String,
    required: true,
  },
  gear: {
    type: String,
    required: true,
  },
  frameMtr: {
    type: String,
    required: true,
  },
  brakeType: {
    type: String,
    required: true,
  },
  frameSize: {
    type: [String],
    required: true,
  },
  images: {
    type: [String],
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const productCollection = new mongoose.model("product_data", productSchema);
module.exports = { productCollection };

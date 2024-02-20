const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  addressId: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  orderId: {
    type: String,
    required: true,
  },
  orderedAt: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  orderStage: {
    type: String,
    required: true,
    default: "PREPARING FOR DISPATCH",
  },
  orderStatus: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  productId: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  orderTotal: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  variant: {
    frameSize: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
    default: "N/A",
  },
  invoiceDownload: {
    type: String,
    default: null,
  },
  wallet: {
    type: Number,
    required: true,
    default: null,
  },
});

const orderCollection = new mongoose.model("order_datas", orderSchema);

module.exports = { orderCollection };

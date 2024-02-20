const mongoose = require("mongoose");

const categoryModel = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
  },
  soldProduct: {
    type: Number,
    required: true,
    default: 0,
  },
  totalSale: {
    type: Number,
    required: true,
    default: 0,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});
const categoryCollection = new mongoose.model("catogory_data", categoryModel);

module.exports = { categoryCollection };

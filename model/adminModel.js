const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const adminCollection = new mongoose.model("admin_data", adminSchema);

module.exports = { adminCollection };

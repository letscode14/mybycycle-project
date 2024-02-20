const mongooose = require("mongoose");

const bannerSchema = new mongooose.Schema({
  image: {
    type: String,
    required: true,
  },
  activeFrom: {
    type: Date,
    required: true,
  },
  activeTo: {
    type: Date,
    required: true,
  },
  bannerCat: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
});

const bannerCollection = new mongooose.model("banner_datas", bannerSchema);
module.exports = { bannerCollection };

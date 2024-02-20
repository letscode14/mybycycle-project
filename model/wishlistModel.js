const mongoose = require("mongoose");

const wishListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Types.ObjectId,
          required: true,
        },
      },
    ],
  },
  { _id: false }
);

const wishlistCollection = new mongoose.model("wishlist_datas", wishListSchema);

module.exports = {
  wishlistCollection,
};

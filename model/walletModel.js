const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  history: {
    type: [
      {
        transactionType: {
          type: String,
          enum: ["Deposit", "Withdrawal"],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  },
});

const WalletCollection = new mongoose.model("wallet_datas", walletSchema);

module.exports = { WalletCollection };

const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    revenued: { type: Boolean, default: false },
    orderDate: Date,
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;

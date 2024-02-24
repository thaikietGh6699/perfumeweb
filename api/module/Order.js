const mongoose = require("mongoose");

const oderSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product",
  },
  user: { type: mongoose.Schema.Types.ObjectId, required: true },
  quantity: Number,
  price: Number,
  name: String,
  sold: { type: Boolean, default: false },
  received: { type: Boolean, default: false },
  orderDate: Date,
  email: String,
  note: String,
  address: String,
  phone: String,
});

const Oder = mongoose.model("Oder", oderSchema);

module.exports = Oder;

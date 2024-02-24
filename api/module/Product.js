const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  photo: [String],
  description: String,
  extraInfo: String,
  price: Number,
  born: Number,
  title: String,
  gender: String,
  type: String,
  from: String,
  sales: { type: Number, default: 0 },
  reviews: [
    {
      review: String,
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      email: String,
      name: String,
      orderDate: Date,
    },
  ],
});

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;

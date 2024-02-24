const mongoose = require("mongoose");
const { Schema } = mongoose;

const Account = new Schema({
  name: String,
  email: String,
  password: String,
  isAdmin: { type: Boolean, default: false },
  phone: String,
  address: String,
});

module.exports = {
  Account: mongoose.model("Account", Account),
};

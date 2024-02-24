const mongoose = require("mongoose");

async function connect() {
  try {
    await mongoose.connect("mongodb://127.0.0.1/perfume-app"),
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      };
    console.log("connect successfully to Mongodb!!!");
  } catch (error) {
    console.log("connect fail!!!");
  }
}

module.exports = { connect };

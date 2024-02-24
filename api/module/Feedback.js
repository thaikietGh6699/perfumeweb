const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  note: String,
  name: String,
  email: String,
  images: [String],
  date: { type: Date, default: Date.now },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Feedback = mongoose.model("feedback", feedbackSchema);

module.exports = Feedback;

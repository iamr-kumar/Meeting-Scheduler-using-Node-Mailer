const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  date: {
      type: Date,
      required: true
  },
  place:{
      type: String
  },
  tag: {
      type: String
  },
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
  }
});

module.exports = mongoose.model("meetings", meetingSchema);
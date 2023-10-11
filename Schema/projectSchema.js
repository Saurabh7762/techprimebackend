const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let projectSchema = new Schema({
  id: String,
  name: String,
  startDate: Date,
  endDate: Date,
  status: String,
  reason: String,
  type: String,
  priority: String,
  division: String,
  category: String,
  dept: String,
  location: String,
  userId: String,
});

module.exports = mongoose.model("project", projectSchema);

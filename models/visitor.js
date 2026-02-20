const mongoose = require("mongoose");

const VisitorSchema = new mongoose.Schema(
  {
    companyName: String,
    designation: String,
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    purposeOfVisit: String,
    host: String,
    visitDate: String,
    checkInTime: String,
    feedback: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Visitor", VisitorSchema);

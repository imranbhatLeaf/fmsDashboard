const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const recordSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    amount: { type: Number, required: true },
    amountAfterTds: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      enum: ["Honorarium", "Salary", "Fellowship", "TA/DA", "Refund"],
    },
    services: {
      type: String,
      required: true,
      enum: ["ASSSR", "VMI", "DHC", "JASSSR"],
    },

    // Unique token for the form link sent to the user
    token: { type: String, default: uuidv4, unique: true },

    // Tracks whether the user submitted the form
    formSubmitted: { type: Boolean, default: false },

    // Stores the submitted form data (fields vary by category/service)
    formData: { type: Object, default: null },

    // Email tracking fields
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
    error: { type: String, default: null },

    // Registrar approval tracking
    registrarApproved: { type: Boolean, default: false },
    registrarApprovedAt: { type: Date, default: null },

    // Admin payment tracking
    paymentProcessed: { type: Boolean, default: false },
    paymentProcessedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Record", recordSchema);

const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const recordSchema = new mongoose.Schema(
  {
    // Core fields
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

    // Extra fields from CSV
    designation: { type: String, default: null },
    payLevel: { type: String, default: null },
    address: { type: String, default: null },
    phoneOffice: { type: String, default: null },
    phoneMobile: { type: String, default: null },
    programmeNature: { type: String, default: null },
    programmeTitle: { type: String, default: null },
    participationType: { type: String, default: null },
    lectureType: { type: String, default: null },
    honorariumBasis: { type: String, default: null },
    numPresences: { type: Number, default: null },
    rate: { type: Number, default: null },
    journeyFrom: { type: String, default: null },
    journeyTo: { type: String, default: null },
    journeyMode: { type: String, default: null },
    journeyAmount: { type: Number, default: null },
    localJourneyFrom: { type: String, default: null },
    localJourneyTo: { type: String, default: null },
    localJourneyMode: { type: String, default: null },
    localJourneyAmount: { type: Number, default: null },
    grandTotal: { type: Number, default: null },
    fellowshipRate: { type: Number, default: null },
    fellowshipTotal: { type: Number, default: null },
    refundAmountClaimed: { type: Number, default: null },
    paymentReceiptNumber: { type: String, default: null },
    paymentReceiptDate: { type: String, default: null },
    refundReason: { type: String, default: null },
    academicYear: { type: String, default: null },

    // Token and form
    token: { type: String, default: uuidv4, unique: true },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
    formSubmitted: { type: Boolean, default: false },
    formData: { type: Object, default: null },
    receiptNumber: { type: String, default: null },
    submittedIp: { type: String, default: null },

    // Email tracking
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
    error: { type: String, default: null },

    // Admin approval tracking (before Registrar)
    adminApproved: { type: Boolean, default: false },
    adminApprovedAt: { type: Date, default: null },

    // Registrar approval tracking
    registrarApproved: { type: Boolean, default: false },
    registrarApprovedAt: { type: Date, default: null },

    // Admin payment tracking
    paymentProcessed: { type: Boolean, default: false },
    paymentProcessedAt: { type: Date, default: null },

    // Bank reference & date of transfer (required before receipt generation)
    bankReferenceNo: { type: String, default: null },
    dateOfTransfer: { type: Date, default: null },

    // Mandatory Explicit Date Fields (Req 11)
    dateOfEntry: { type: Date, default: Date.now },
    dateOfUpload: { type: Date, default: null },
    dateOfForwarding: { type: Date, default: null },
    dateOfApproval: { type: Date, default: null },

    // Soft-delete support (recycle bin)
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-purge soft-deleted records after 30 days
recordSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60, sparse: true });

module.exports = mongoose.model("Record", recordSchema);

const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const recordSchema = new mongoose.Schema(
  {
    // Meta / Ingest Data
    row_id: { type: String, required: true },
    component: { 
      type: String, 
      required: true, 
      trim: true,
      uppercase: true, 
      enum: ["ASSSR", "VMI", "DHC", "JASSSR"] 
    },
    form_type: { 
      type: String, 
      required: true, 
      trim: true,
      lowercase: true, 
      enum: ["allowance", "fellowship", "honorarium", "refund"] 
    },
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    pay_level: { type: String, default: null },
    address: { type: String, required: true, trim: true },
    phone_office: { type: String, default: null },
    phone_mobile: { type: String, required: true },
    email: { type: String, required: true, trim: true, lowercase: true },

    // Programme details
    programme_nature: { type: String, default: null },
    programme_title: { type: String, default: null },

    // Honorarium specific
    participation_type: { 
      type: String, 
      enum: ["Expert", "Resource Person", null], 
      default: null 
    },
    lecture_type: { 
      type: String, 
      enum: ["Online", "Offline", null], 
      default: null 
    },
    honorarium_basis: { type: String, default: null }, // e.g. "per hour", "per day"
    num_presences: { type: Number, default: null },
    rate: { type: Number, default: null },
    total_amount: { type: Number, default: null },

    // Allowance specific
    journey_from: { type: String, default: null },
    journey_to: { type: String, default: null },
    journey_mode: { 
      type: String, 
      enum: ["Road", "Rail", "Air", null], 
      default: null 
    },
    journey_amount: { type: Number, default: null },
    local_journey_from: { type: String, default: null },
    local_journey_to: { type: String, default: null },
    local_journey_mode: { 
      type: String, 
      enum: ["Bus", "Taxi", "Car", null], 
      default: null 
    },
    local_journey_amount: { type: Number, default: null },
    grand_total: { type: Number, default: null },
    amount: { type: Number, default: null },
    amountAfterTds: { type: Number, default: null },

    // Fellowship specific
    fellowship_rate: { type: Number, default: null },
    fellowship_total: { type: Number, default: null },

    // Refund specific
    refund_amount_claimed: { type: Number, default: null },
    payment_receipt_number: { type: String, default: null },
    payment_receipt_date: { type: Date, default: null }, // YYYY-MM-DD
    refund_reason: { type: String, default: null },
    academic_year: { type: String, default: null },

    // System-Managed (Workflow)
    payee_status: { 
      type: String, 
      enum: ["pending", "completed", "expired"], 
      default: "pending" 
    },
    payee_link_token: { 
      type: String, 
      required: true, 
      unique: true 
    }, // Generated cryptographically
    expiresAt: { 
      type: Date, 
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
    }, // 30-day token expiry TTL

    // Payee-Filled Fields (Must be blank on admin upload)
    pan_number: { type: String, default: null },
    aadhaar_number: { type: String, default: null },
    beneficiary_name: { type: String, default: null },
    account_number: { type: String, default: null },
    bank_name: { type: String, default: null },
    ifsc_code: { type: String, default: null },
    bank_branch_address: { type: String, default: null },

    // Backward Compatibility fields
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
    token: { type: String, required: true, unique: true },

    receiptNumber: { type: String, default: null },
    submittedIp: { type: String, default: null },

    // Tracks whether the user submitted the form
    formSubmitted: { type: Boolean, default: false },

    // Stores the submitted form data (fields vary by category/service)
    formData: { type: Object, default: null },

    // Email tracking fields
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

    // Soft-delete support (recycle bin)
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-purge soft-deleted records after 30 days
recordSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model("Record", recordSchema);

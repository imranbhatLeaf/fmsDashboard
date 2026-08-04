import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../assets/logomain.avif";
import asssrLogo from "../assets/asssrFav.avif";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

function BankDetails({ data, onChange }) {
  return (
    <fieldset className="mt-8 border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
      <legend className="text-xs uppercase tracking-widest text-black px-2 font-bold bg-white">
        Bank Account Details (all fields mandatory)
      </legend>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <Field label="Account Beneficiary Name" name="bankBeneficiaryName" value={data.bankBeneficiaryName} onChange={onChange} required />
        <Field label="Bank Name" name="bankName" value={data.bankName} onChange={onChange} required />
        <Field label="Account Number" name="bankAccountNumber" value={data.bankAccountNumber} onChange={onChange} required />
        <Field label="Confirm Account Number" name="bankAccountNumberConfirm" value={data.bankAccountNumberConfirm} onChange={onChange} required />
        <Field label="IFSC Code" name="bankIfsc" value={data.bankIfsc} onChange={onChange} required />
        <Field label="Confirm IFSC Code" name="bankIfscConfirm" value={data.bankIfscConfirm} onChange={onChange} required />
        <div className="md:col-span-2">
          <Field label="Bank Branch Address" name="bankBranchAddress" value={data.bankBranchAddress} onChange={onChange} required />
        </div>
      </div>
    </fieldset>
  );
}

// Personal details — common to most forms
function PersonalDetails({ data, onChange, showDesignation = true }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Name" name="name" value={data.name} onChange={onChange} required disabled />
      {showDesignation && (
        <Field label="Designation" name="designation" value={data.designation} onChange={onChange} required disabled />
      )}
      <div className="md:col-span-2">
        <Field label="Address" name="address" value={data.address} onChange={onChange} required disabled />
      </div>
      <Field label="Mobile" name="mobile" value={data.mobile} onChange={onChange} required />
      <Field label="Email" name="email" value={data.email} onChange={onChange} required disabled type="email" />
      <Field label="PAN Card" name="pan" value={data.pan} onChange={onChange} required />
      <Field label="Confirm PAN Card" name="panConfirm" value={data.panConfirm} onChange={onChange} required />
    </div>
  );
}

// Fields where copy/paste should be disabled (security-sensitive)
const NO_COPY_PASTE_FIELDS = ["pan", "panConfirm", "bankAccountNumber", "bankAccountNumberConfirm", "bankIfsc", "bankIfscConfirm"];

// Reusable field component
function Field({ label, name, value, onChange, required, disabled, type = "text" }) {
  const isSecure = NO_COPY_PASTE_FIELDS.includes(name);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-700">
        {label}{required && <span className="text-black ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        required={required}
        autoComplete="off"
        onPaste={isSecure && !disabled ? (e) => e.preventDefault() : undefined}
        onCopy={isSecure && !disabled ? (e) => e.preventDefault() : undefined}
        onCut={isSecure && !disabled ? (e) => e.preventDefault() : undefined}
        className="border-b-2 border-gray-200 px-0 py-2 text-sm bg-transparent text-black focus:outline-none focus:border-black disabled:text-gray-400 transition-colors"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, required, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-700">
        {label}{required && <span className="text-black ml-0.5">*</span>}
      </label>
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        className="border-b-2 border-gray-200 px-0 py-2 text-sm bg-transparent text-black focus:outline-none focus:border-black transition-colors"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function RadioGroup({ label, name, value, onChange, required, options }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold text-gray-700">
        {label}{required && <span className="text-black ml-0.5">*</span>}
      </span>
      <div className="flex gap-4 flex-wrap">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm cursor-pointer text-black">
            <input
              type="radio"
              name={name}
              value={o}
              checked={value === o}
              onChange={onChange}
              required={required}
              className="accent-black"
            />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
}

// Honorarium form fields
function HonorariumFields({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nature of Programme" name="natureOfProgramme" value={data.natureOfProgramme} onChange={onChange} required />
        <Field label="Title of Programme" name="titleOfProgramme" value={data.titleOfProgramme} onChange={onChange} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RadioGroup label="Nature of Participation" name="natureOfParticipation" value={data.natureOfParticipation} onChange={onChange} required options={["Expert", "Resource Person"]} />
        <RadioGroup label="Lecture Type" name="lectureType" value={data.lectureType} onChange={onChange} required options={["Online", "Offline"]} />
        <RadioGroup label="Honorarium Basis" name="honorariumBasis" value={data.honorariumBasis} onChange={onChange} required options={["Per Hour", "Per Day"]} />
        <Field label="Number of Days/Hours" name="numberOfPresences" value={data.numberOfPresences} onChange={onChange} required type="number" />
        <Field label="Rate (₹)" name="rate" value={data.rate} onChange={onChange} required type="number" />
        <Field label="Total (₹)" name="total" value={data.total} onChange={onChange} required type="number" />
      </div>
    </div>
  );
}

// Fellowship form fields
function FellowshipFields({ data, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Nature of Programme" name="natureOfProgramme" value={data.natureOfProgramme} onChange={onChange} required />
      <Field label="Title of Programme" name="titleOfProgramme" value={data.titleOfProgramme} onChange={onChange} required />
      <Field label="Rate (₹)" name="rate" value={data.rate} onChange={onChange} required type="number" />
      <Field label="Total (₹)" name="total" value={data.total} onChange={onChange} required type="number" />
    </div>
  );
}

// Salary form fields (same as Fellowship but TDS applies on backend)
function SalaryFields({ data, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Nature of Programme" name="natureOfProgramme" value={data.natureOfProgramme} onChange={onChange} required />
      <Field label="Title of Programme" name="titleOfProgramme" value={data.titleOfProgramme} onChange={onChange} required />
      <Field label="Rate (₹)" name="rate" value={data.rate} onChange={onChange} required type="number" />
      <Field label="Total (₹)" name="total" value={data.total} onChange={onChange} required type="number" />
    </div>
  );
}

// TA/DA form fields
function TadaFields({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888] mb-3">Journey Details</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="From" name="journeyFrom" value={data.journeyFrom} onChange={onChange} required />
          <Field label="To" name="journeyTo" value={data.journeyTo} onChange={onChange} required />
          <Select label="Mode" name="journeyMode" value={data.journeyMode} onChange={onChange} required options={["Road", "Rail", "Air"]} />
          <Field label="Amount (₹)" name="journeyAmount" value={data.journeyAmount} onChange={onChange} required type="number" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#888] mb-3">Local Journey Details</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="From" name="localFrom" value={data.localFrom} onChange={onChange} />
          <Field label="To" name="localTo" value={data.localTo} onChange={onChange} />
          <Select label="Mode" name="localMode" value={data.localMode} onChange={onChange} options={["Bus", "Taxi", "Car"]} />
          <Field label="Amount (₹)" name="localAmount" value={data.localAmount} onChange={onChange} type="number" />
        </div>
      </div>
      <Field label="Remarks (if any)" name="remarks" value={data.remarks} onChange={onChange} />
    </div>
  );
}

// Refund form fields
function RefundFields({ data, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Amount for which Refund is Claimed (₹)" name="refundAmount" value={data.refundAmount} onChange={onChange} required type="number" />
      <Field label="Payment Receipt Number" name="receiptNumber" value={data.receiptNumber} onChange={onChange} required />
      <Field label="Receipt Date" name="receiptDate" value={data.receiptDate} onChange={onChange} required type="date" />
      <Field label="Reason for Refund" name="refundReason" value={data.refundReason} onChange={onChange} required />
      <Field label="Programme Applied For" name="programmeName" value={data.programmeName} onChange={onChange} required />
      <Field label="Academic Year" name="academicYear" value={data.academicYear} onChange={onChange} required />
    </div>
  );
}

// Service logo/name map
const SERVICE_LABELS = {
  ASSSR: "Asiatic Society for Social Science Research",
  VMI: "Varāhamihira Multidisciplinary Institute",
  DHC: "Deccan History Congress",
  JASSSR: "JASSSR",
};

// Claim Summary Component
function ClaimSummary({ meta }) {
  const component = meta.component || meta.services;
  // Derive form_type robustly from both the explicit field and the category
  const categoryToFormType = {
    "TA/DA": "allowance",
    "Fellowship": "fellowship",
    "Honorarium": "honorarium",
    "Refund": "refund",
    "Salary": "salary",
  };
  const form_type = meta.form_type ||
    (meta.category === "TA/DA" ? "allowance" : categoryToFormType[meta.category] || meta.category?.toLowerCase());

  // Pick the right label set for honorarium basis
  const getHonorariumBasisLabel = (basis) => {
    if (!basis) return "";
    const b = basis.toLowerCase();
    if (component === "ASSSR") {
      if (b.includes("hour")) return "Per Hour";
      if (b.includes("day")) return "Per Day";
    } else {
      if (b.includes("hour") || b.includes("lecture")) return "Per Lecture";
      if (b.includes("day")) return "Per Day";
    }
    return basis;
  };

  const getPresencesLabel = () => {
    const basis = meta.honorarium_basis?.toLowerCase() || "";
    if (component === "ASSSR") {
      if (basis.includes("hour")) return "Number of Hours";
      return "Number of Days";
    } else {
      if (basis.includes("hour") || basis.includes("lecture")) return "Number of Lectures";
      return "Number of Days";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 text-black mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Component</span>
          <span className="text-sm font-medium">{component}</span>
        </div>
        <div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Form Type</span>
          <span className="text-sm font-medium capitalize">{form_type}</span>
        </div>
      </div>

      {form_type === "honorarium" && (
        <div className="border-t pt-3 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">Honorarium Claim Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div><strong>Nature of Programme:</strong> {meta.programme_nature}</div>
            <div><strong>Title of Programme:</strong> {meta.programme_title}</div>
            <div><strong>Participation:</strong> {meta.participation_type}</div>
            <div><strong>Lecture Mode:</strong> {meta.lecture_type}</div>
            <div><strong>Honorarium Basis:</strong> {getHonorariumBasisLabel(meta.honorarium_basis)}</div>
            <div><strong>{getPresencesLabel()}:</strong> {meta.num_presences}</div>
            <div><strong>Rate:</strong> ₹ {Number(meta.rate).toLocaleString("en-IN")}</div>
            <div className="sm:col-span-2 font-bold text-sm border-t pt-1.5 mt-1.5">
              Total Amount: ₹ {Number(meta.total_amount || meta.amount).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {form_type === "fellowship" && (
        <div className="border-t pt-3 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">Fellowship Claim Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div><strong>Nature of Fellowship:</strong> {meta.programme_nature}</div>
            <div><strong>Fellowship Title:</strong> {meta.programme_title}</div>
            <div className="sm:col-span-2 font-bold text-sm border-t pt-1.5 mt-1.5">
              Total Fellowship: ₹ {Number(meta.fellowship_total || meta.amount).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {form_type === "allowance" && (
        <div className="border-t pt-3 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">Travel Allowance (TA/DA) details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div><strong>Nature of Programme:</strong> {meta.programme_nature}</div>
            <div><strong>Title of Programme:</strong> {meta.programme_title}</div>
            <div className="sm:col-span-2 border-t pt-1.5">
              <span className="font-bold text-[10px] uppercase block text-gray-500 mb-0.5">Primary Journey</span>
              <div>From {meta.journey_from} to {meta.journey_to} via {meta.journey_mode} (₹ {Number(meta.journey_amount).toLocaleString("en-IN")})</div>
            </div>
            {meta.local_journey_amount > 0 && (
              <div className="sm:col-span-2 border-t pt-1.5">
                <span className="font-bold text-[10px] uppercase block text-gray-500 mb-0.5">Local Leg</span>
                <div>From {meta.local_journey_from} to {meta.local_journey_to} via {meta.local_journey_mode} (₹ {Number(meta.local_journey_amount).toLocaleString("en-IN")})</div>
              </div>
            )}
            <div className="sm:col-span-2 font-bold text-sm border-t pt-1.5 mt-1.5">
              Grand Total: ₹ {Number(meta.grand_total || meta.amount).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {form_type === "refund" && (
        <div className="border-t pt-3 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">Refund Claim Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div><strong>Programme Applied For:</strong> {meta.programme_title}</div>
            <div><strong>Payment Receipt Number:</strong> {meta.payment_receipt_number}</div>
            <div><strong>Receipt Date:</strong> {meta.payment_receipt_date ? new Date(meta.payment_receipt_date).toLocaleDateString("en-IN") : ""}</div>
            <div><strong>Reason for Refund:</strong> {meta.refund_reason}</div>
            <div><strong>Academic Year:</strong> {meta.academic_year}</div>
            <div className="sm:col-span-2 font-bold text-sm border-t pt-1.5 mt-1.5">
              Refund Claimed: ₹ {Number(meta.refund_amount_claimed || meta.amount).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FormPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    async function fetchMeta() {
      try {
        const res = await fetch(`${API_BASE}/api/form/${token}`);
        if (!res.ok) { setError("invalid"); return; }
        const data = await res.json();
        setMeta(data);
        if (data.formSubmitted) {
          setSubmitted(true);
        }
        setFormData({
          name: data.name,
          email: data.email,
          designation: data.designation,
          address: data.address,
          officePhone: data.phone_office,
          mobile: data.phone_mobile,
          pan: "",
          panConfirm: "",
          bankBeneficiaryName: "",
          bankAccountNumber: "",
          bankAccountNumberConfirm: "",
          bankName: "",
          bankIfsc: "",
          bankIfscConfirm: "",
          bankBranchAddress: ""
        });
      } catch {
        setError("network");
      } finally {
        setLoading(false);
      }
    }
    fetchMeta();
  }, [token]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    // Validate PAN/IFSC client-side
    const pan = formData.pan?.trim();
    const ifsc = formData.bankIfsc?.trim();

  const PAN_REGEX = /^[A-Za-z]{6}[0-9]{4}$/;
    if (!pan || !PAN_REGEX.test(pan)) {
      setFormError("PAN Card must be 6 letters followed by 4 numbers.");
      setSubmitting(false);
      return;
    }

    if (formData.pan !== formData.panConfirm) {
      setFormError("PAN Card numbers do not match.");
      setSubmitting(false);
      return;
    }

    // Mobile Number: exactly 10 digits
    const mobile = formData.mobile?.trim();
    if (mobile && !/^\d{10}$/.test(mobile)) {
      setFormError("Mobile Number must be exactly 10 digits (numbers only).");
      setSubmitting(false);
      return;
    }

    // Bank Name: minimum 6 characters, letters/spaces only (no numbers or special characters)
    const bankName = formData.bankName?.trim();
    const BANK_NAME_REGEX = /^[A-Za-z ]{6,}$/;
    if (!bankName || !BANK_NAME_REGEX.test(bankName)) {
      setFormError("Bank Name must be at least 6 characters and contain only letters.");
      setSubmitting(false);
      return;
    }

    if (!ifsc || !ifsc.trim()) {
      setFormError("IFSC Code is required.");
      setSubmitting(false);
      return;
    }

    // IFSC Code: minimum 6 characters, alphanumeric only
    const IFSC_REGEX = /^[A-Za-z0-9]{6,}$/;
    if (!IFSC_REGEX.test(ifsc)) {
      setFormError("IFSC Code must be at least 6 characters and contain only letters and numbers.");
      setSubmitting(false);
      return;
    }

    // Account Number: minimum 6 digits, numbers only
    const accountNumber = formData.bankAccountNumber?.trim();
    const ACCOUNT_NUMBER_REGEX = /^[0-9]{6,}$/;
    if (!accountNumber || !ACCOUNT_NUMBER_REGEX.test(accountNumber)) {
      setFormError("Account Number must be at least 6 digits and contain only numbers.");
      setSubmitting(false);
      return;
    }

    if (formData.bankAccountNumber !== formData.bankAccountNumberConfirm) {
      setFormError("Account Numbers do not match.");
      setSubmitting(false);
      return;
    }

    if (formData.bankIfsc !== formData.bankIfscConfirm) {
      setFormError("IFSC Codes do not match.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/form/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed.");
      setSubmitted(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center" style={{ fontFamily: 'Tahoma, sans-serif' }}>
        <p className="text-[#888] text-xs">Loading your form…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4" style={{ fontFamily: 'Tahoma, sans-serif' }}>
        <div className="bg-white border border-[#e0e0e0] rounded-xl p-8 max-w-md text-center shadow-sm">
          <h2 className="text-base font-bold mb-2 text-black">Invalid Link</h2>
          <p className="text-xs text-[#666]">This form link is invalid or has expired. Please contact the accounts section.</p>
        </div>
      </div>
    );
  }

  if (submitted || (meta && meta.formSubmitted)) {
    const status = meta?.approvalStatus || "Pending Verification & Approval";
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4" style={{ fontFamily: 'Tahoma, sans-serif' }}>
        <div className="bg-white border border-[#e0e0e0] rounded-xl p-8 max-w-md text-center shadow-sm w-full">
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-4 font-bold text-sm">
            ✓
          </div>
          <h2 className="text-base font-bold mb-2 text-black font-serif">Form Submitted</h2>
          <p className="text-xs text-gray-500 mb-6">Your verification details and bank account have been successfully submitted.</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100 text-left">
            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Current Status</span>
            <span className="text-xs font-bold text-black">{status}</span>
          </div>

          <button
            onClick={() => {
              const link = window.location.href;
              navigator.clipboard.writeText(link);
              alert("Status link copied to clipboard!");
            }}
            className="w-full bg-black text-white text-xs font-bold py-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors shadow-sm"
          >
            Copy Status Link
          </button>
        </div>
      </div>
    );
  }

  const { services } = meta;

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-4 px-4" style={{ fontFamily: 'Tahoma, sans-serif' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white text-black border border-gray-200 rounded-lg px-5 py-4 mb-4 relative shadow-sm">
          <div className="absolute top-6 right-8 gap-3 hidden sm:flex">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src={logo} alt="AFMS Logo" className="w-full h-full object-contain" />
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              <img src={asssrLogo} alt="ASSSR Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">{services}</p>
          <h1 className="font-bold text-xl text-black">{SERVICE_LABELS[services] || services}</h1>
          <p className="text-xs text-gray-500 mt-1 sm:pr-16">
            Payee Completion Form
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-white border-l-2 border-black px-4 py-2.5 mb-4 text-xs text-gray-700 shadow-sm rounded-r-lg">
          <p className="mb-0.5">• Review the details of your claim below.</p>
          <p className="mb-0.5">• Provide your bank details and PAN to process payment.</p>
          <p>• Fields marked with <span className="text-black font-bold">*</span> are mandatory.</p>
        </div>

        {/* Claim Details Summary */}
        <ClaimSummary meta={meta} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-4 md:p-6 space-y-5 shadow-sm">
          {/* Personal Details */}
          <div>
            <h2 className="text-xs uppercase tracking-wider text-black font-bold mb-3 pb-1 border-b border-gray-100">
              Payee Credentials
            </h2>
            <PersonalDetails
              data={formData}
              onChange={handleChange}
              showDesignation={meta.form_type !== "refund" && meta.category !== "Refund"}
            />
          </div>

          {/* Bank Details */}
          <div>
            <h2 className="text-xs uppercase tracking-wider text-black font-bold mb-3 pb-1 border-b border-gray-100">
              Bank Account Details
            </h2>
            <BankDetails data={formData} onChange={handleChange} />
          </div>
             {/* TA/DA Fields */}
         

          {formError && (
            <p className="text-red-600 text-sm border-l-4 border-red-600 p-3 bg-red-50">{formError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-black text-white text-sm font-bold py-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {submitting ? "Submitting…" : "Submit Verification & Bank Details"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          This form was sent to you by {SERVICE_LABELS[services]}. For queries, contact the accounts section.
        </p>
      </div>
    </div>
  );
}

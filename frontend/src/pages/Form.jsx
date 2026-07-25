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
        <Field label="Bank" name="bankName" value={data.bankName} onChange={onChange} required />
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
      <Field label="Office Phone" name="officePhone" value={data.officePhone} onChange={onChange} disabled />
      <Field label="Mobile" name="mobile" value={data.mobile} onChange={onChange} required disabled />
      <Field label="Email" name="email" value={data.email} onChange={onChange} required disabled />
      <Field label="PAN Card" name="pan" value={data.pan} onChange={onChange} required />
      <Field label="Aadhaar ID" name="aadhaar" value={data.aadhaar} onChange={onChange} />
    </div>
  );
}

// Reusable field component
function Field({ label, name, value, onChange, required, disabled, type = "text" }) {
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
  const form_type = meta.form_type || (meta.category === "TA/DA" ? "allowance" : meta.category?.toLowerCase());

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
    <div className="bg-white border border-[#e4dfd4] rounded-lg p-6 shadow-sm space-y-4 text-black mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="border-t pt-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">Honorarium Claim Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><strong>Nature of Programme:</strong> {meta.programme_nature}</div>
            <div><strong>Title of Programme:</strong> {meta.programme_title}</div>
            <div><strong>Participation:</strong> {meta.participation_type}</div>
            <div><strong>Lecture Mode:</strong> {meta.lecture_type}</div>
            <div><strong>Honorarium Basis:</strong> {getHonorariumBasisLabel(meta.honorarium_basis)}</div>
            <div><strong>{getPresencesLabel()}:</strong> {meta.num_presences}</div>
            <div><strong>Rate:</strong> ₹ {Number(meta.rate).toLocaleString("en-IN")}</div>
            <div className="sm:col-span-2 font-bold text-base border-t pt-2 mt-2">
              Total Amount: ₹ {Number(meta.total_amount || meta.amount).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {form_type === "fellowship" && (
        <div className="border-t pt-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">Fellowship Claim Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><strong>Nature of Fellowship:</strong> {meta.programme_nature}</div>
            <div><strong>Fellowship Title:</strong> {meta.programme_title}</div>
            <div><strong>Fellowship Rate:</strong> ₹ {Number(meta.fellowship_rate || meta.rate).toLocaleString("en-IN")}</div>
            <div className="sm:col-span-2 font-bold text-base border-t pt-2 mt-2">
              Total Fellowship: ₹ {Number(meta.fellowship_total || meta.amount).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {form_type === "allowance" && (
        <div className="border-t pt-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">Travel Allowance (TA/DA) details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><strong>Nature of Programme:</strong> {meta.programme_nature}</div>
            <div><strong>Title of Programme:</strong> {meta.programme_title}</div>
            <div className="sm:col-span-2 border-t pt-2">
              <span className="font-bold text-xs uppercase block text-gray-500 mb-1">Primary Journey</span>
              <div>From {meta.journey_from} to {meta.journey_to} via {meta.journey_mode} (₹ {Number(meta.journey_amount).toLocaleString("en-IN")})</div>
            </div>
            {meta.local_journey_amount > 0 && (
              <div className="sm:col-span-2 border-t pt-2">
                <span className="font-bold text-xs uppercase block text-gray-500 mb-1">Local Leg</span>
                <div>From {meta.local_journey_from} to {meta.local_journey_to} via {meta.local_journey_mode} (₹ {Number(meta.local_journey_amount).toLocaleString("en-IN")})</div>
              </div>
            )}
            <div className="sm:col-span-2 font-bold text-base border-t pt-2 mt-2">
              Grand Total: ₹ {Number(meta.grand_total || meta.amount).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {form_type === "refund" && (
        <div className="border-t pt-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">Refund Claim Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><strong>Programme Applied For:</strong> {meta.programme_title}</div>
            <div><strong>Payment Receipt Number:</strong> {meta.payment_receipt_number}</div>
            <div><strong>Receipt Date:</strong> {meta.payment_receipt_date ? new Date(meta.payment_receipt_date).toLocaleDateString("en-IN") : ""}</div>
            <div><strong>Reason for Refund:</strong> {meta.refund_reason}</div>
            <div><strong>Academic Year:</strong> {meta.academic_year}</div>
            <div className="sm:col-span-2 font-bold text-base border-t pt-2 mt-2">
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
        setFormData({
          name: data.name,
          email: data.email,
          designation: data.designation,
          address: data.address,
          officePhone: data.phone_office,
          mobile: data.phone_mobile,
          pan: "",
          aadhaar: "",
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

    if (!pan || !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(pan)) {
      setFormError("Invalid PAN format. Must be a 10-character alphanumeric PAN (e.g. ABCDE1234F).");
      setSubmitting(false);
      return;
    }

    if (!ifsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc)) {
      setFormError("Invalid IFSC format. Must be an 11-character alphanumeric code (e.g. SBIN0001234).");
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
      navigate(`/receipt/${token}`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <p className="text-[#888] text-sm">Loading your form…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4">
        <div className="bg-white border border-[#e0e0e0] rounded-xl p-8 max-w-md text-center">
          <h2 className="font-serif text-xl font-semibold mb-2 text-black">Invalid link</h2>
          <p className="text-sm text-[#666]">This form link is invalid or has expired. Please contact the accounts section.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4">
        <div className="bg-white border border-[#e0e0e0] rounded-xl p-8 max-w-md text-center">
          <div className="w-10 h-10 rounded-full bg-[#f0f0f0] border border-[#e0e0e0] flex items-center justify-center mx-auto mb-4">
            <span className="text-black text-lg">✓</span>
          </div>
          <h2 className="font-serif text-xl font-semibold mb-2 text-black">Form submitted</h2>
          <p className="text-sm text-[#666]">Your details have been received. The accounts section will process your payment shortly.</p>
        </div>
      </div>
    );
  }

  const { services } = meta;

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-black text-white rounded-lg px-8 py-6 mb-6 relative shadow-sm">
          <div className="absolute top-6 right-8 gap-3 hidden sm:flex">
            <div className="w-14 h-14 flex items-center justify-center">
              <img src={logo} alt="AFMS Logo" className="w-full h-full object-contain filter invert" />
            </div>
            <div className="w-14 h-14 flex items-center justify-center">
              <img src={asssrLogo} alt="ASSSR Logo" className="w-full h-full object-contain filter invert" />
            </div>
          </div>
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{services}</p>
          <h1 className="font-bold text-2xl">{SERVICE_LABELS[services] || services}</h1>
          <p className="text-sm text-gray-300 mt-1 sm:pr-16">
            Payee Completion Form
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-white border-l-4 border-black px-6 py-4 mb-6 text-sm text-gray-700 shadow-sm">
          <p>• Review the details of your claim below.</p>
          <p>• Provide your bank details and PAN/Aadhaar to process payment.</p>
          <p>• Fields marked with <span className="text-black font-bold">*</span> are mandatory.</p>
        </div>

        {/* Claim Details Summary */}
        <ClaimSummary meta={meta} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 md:p-8 space-y-8 shadow-sm">
          {/* Personal Details */}
          <div>
            <h2 className="text-sm uppercase tracking-widest text-black font-bold mb-4 pb-2 border-b-2 border-gray-100">
              Personal Verification & PII
            </h2>
            <PersonalDetails
              data={formData}
              onChange={handleChange}
              showDesignation={meta.form_type !== "refund" && meta.category !== "Refund"}
            />
          </div>

          {/* Bank Details */}
          <div>
            <h2 className="text-sm uppercase tracking-widest text-black font-bold mb-4 pb-2 border-b-2 border-gray-100">
              Bank Account Details
            </h2>
            <BankDetails data={formData} onChange={handleChange} />
          </div>

          {formError && (
            <p className="text-red-600 text-sm border-l-4 border-red-600 p-3 bg-red-50">{formError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-black text-white text-base font-bold py-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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

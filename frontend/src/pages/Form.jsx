import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import logo from "../assets/logomain.avif";
import asssrLogo from "../assets/asssr.avif";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

// Bank details fields — common to all forms
function BankDetails({ data, onChange }) {
  return (
    <fieldset className="mt-8 border border-[#e0e0e0] rounded-xl p-6 bg-[#fafafa]">
      <legend className="text-[10px] uppercase tracking-widest text-[#888] px-2 font-semibold">
        Bank Account Details (all fields mandatory)
      </legend>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Field label="Beneficiary's Name" name="bankBeneficiaryName" value={data.bankBeneficiaryName} onChange={onChange} required />
        <Field label="Account Number" name="bankAccountNumber" value={data.bankAccountNumber} onChange={onChange} required />
        <Field label="Bank Name" name="bankName" value={data.bankName} onChange={onChange} required />
        <Field label="IFSC Code" name="bankIfsc" value={data.bankIfsc} onChange={onChange} required />
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
        <Field label="Designation" name="designation" value={data.designation} onChange={onChange} required />
      )}
      <div className="md:col-span-2">
        <Field label="Address" name="address" value={data.address} onChange={onChange} required />
      </div>
      <Field label="Office Phone" name="officePhone" value={data.officePhone} onChange={onChange} />
      <Field label="Mobile" name="mobile" value={data.mobile} onChange={onChange} required />
      <Field label="Email" name="email" value={data.email} onChange={onChange} required disabled />
      <Field label="PAN Number" name="pan" value={data.pan} onChange={onChange} required />
      <Field label="Aadhaar Number" name="aadhaar" value={data.aadhaar} onChange={onChange} />
    </div>
  );
}

// Reusable field component
function Field({ label, name, value, onChange, required, disabled, type = "text" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold text-[#888] uppercase tracking-widest">
        {label}{required && <span className="text-black ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="border border-[#ddd] rounded-lg px-3 py-2 text-sm bg-white text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-[#f5f5f0] disabled:text-[#999] disabled:cursor-not-allowed transition-colors"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, required, options }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold text-[#888] uppercase tracking-widest">
        {label}{required && <span className="text-black ml-0.5">*</span>}
      </label>
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        className="border border-[#ddd] rounded-lg px-3 py-2 text-sm bg-white text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
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
      <span className="text-[10px] font-semibold text-[#888] uppercase tracking-widest">
        {label}{required && <span className="text-black ml-0.5">*</span>}
      </span>
      <div className="flex gap-4 flex-wrap">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm cursor-pointer text-[#333]">
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

export default function FormPage() {
  const { token } = useParams();
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
        if (res.status === 410) { setError("already_submitted"); return; }
        if (!res.ok) { setError("invalid"); return; }
        const data = await res.json();
        setMeta(data);
        setFormData({ name: data.name, email: data.email });
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
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <p className="text-[#888] text-sm">Loading your form…</p>
      </div>
    );
  }

  if (error === "already_submitted") {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center px-4">
        <div className="bg-white border border-[#e0e0e0] rounded-xl p-8 max-w-md text-center">
          <div className="w-10 h-10 rounded-full bg-[#f0f0f0] border border-[#e0e0e0] flex items-center justify-center mx-auto mb-4">
            <span className="text-black text-lg">✓</span>
          </div>
          <h2 className="font-serif text-xl font-semibold mb-2 text-black">Already submitted</h2>
          <p className="text-sm text-[#666]">Your form has already been submitted. Please contact the accounts section if you need to make changes.</p>
        </div>
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

  const { category, services } = meta;

  return (
    <div className="min-h-screen bg-[#f5f5f0] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-black text-white rounded-xl px-8 py-6 mb-6 relative">
          <div className="absolute top-6 right-8 flex gap-3 hidden sm:flex">
            <div className="w-14 h-14 flex items-center justify-center">
              <img src={logo} alt="AFMS Logo" className="w-full h-full object-contain" />
            </div>
            <div className="w-14 h-14 flex items-center justify-center">
              <img src={asssrLogo} alt="ASSSR Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">{services}</p>
          <h1 className="font-serif text-xl font-semibold">{SERVICE_LABELS[services] || services}</h1>
          <p className="text-sm text-white/60 mt-1 sm:pr-16">
            {category === "TA/DA" ? "Traveling and Dearness Allowance Bill Form" :
             category === "Honorarium" ? "Honorarium Bill Form" :
             category === "Fellowship" ? "Fellowship Bill Form" :
             category === "Refund" ? "Application Form for Refund of Fees" :
             `${category} Form`}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-white border border-[#e0e0e0] rounded-xl px-6 py-4 mb-6 text-xs text-[#555] space-y-1">
          <p>• The bill must be pre-receipted.</p>
          <p>• Incomplete/incorrect applications will be rejected without intimation.</p>
          <p>• Fields marked with <span className="text-black font-semibold">*</span> are mandatory.</p>
          <p>• Please enclose a copy of your bank passbook or cancelled cheque.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#e0e0e0] rounded-xl p-6 md:p-8 space-y-8">
          {/* Personal Details */}
          <div>
            <h2 className="text-[10px] uppercase tracking-widest text-[#aaa] font-semibold mb-4 pb-2 border-b border-[#f0f0f0]">
              Personal Details
            </h2>
            <PersonalDetails
              data={formData}
              onChange={handleChange}
              showDesignation={category !== "Refund"}
            />
          </div>

          {/* Category-specific fields */}
          <div>
            <h2 className="text-[10px] uppercase tracking-widest text-[#aaa] font-semibold mb-4 pb-2 border-b border-[#f0f0f0]">
              {category === "TA/DA" ? "TA/DA Allowance Details" :
               category === "Refund" ? "Refund Details" :
               "Programme Details"}
            </h2>
            {category === "Honorarium" && <HonorariumFields data={formData} onChange={handleChange} />}
            {category === "Fellowship" && <FellowshipFields data={formData} onChange={handleChange} />}
            {category === "TA/DA" && <TadaFields data={formData} onChange={handleChange} />}
            {category === "Refund" && <RefundFields data={formData} onChange={handleChange} />}
            {category === "Salary" && (
              <p className="text-sm text-[#666]">Please provide your bank details below to receive your salary.</p>
            )}
          </div>

          {/* Bank Details */}
          <div>
            <h2 className="text-[10px] uppercase tracking-widest text-[#aaa] font-semibold mb-4 pb-2 border-b border-[#f0f0f0]">
              Bank Account Details
            </h2>
            <BankDetails data={formData} onChange={handleChange} />
          </div>

          {formError && (
            <p className="text-[#555] text-sm border border-[#e0e0e0] rounded-lg px-4 py-3 bg-[#fafafa]">{formError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-black text-white border-none text-sm font-semibold px-5 py-3 rounded-lg cursor-pointer transition-colors hover:bg-[#222] disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
          >
            {submitting ? "Submitting…" : "Submit Form"}
          </button>
        </form>

        <p className="text-center text-xs text-[#aaa] mt-4">
          This form was sent to you by {SERVICE_LABELS[services]}. For queries, contact the accounts section.
        </p>
      </div>
    </div>
  );
}

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
        <Field label="Account Beneficiary Name" name="bankBeneficiaryName" value={data.bankBeneficiaryName} onChange={onChange} required disabled />
        <Field label="Bank Name" name="bankName" value={data.bankName} onChange={onChange} required />
        <Field label="Account Number" name="bankAccountNumber" value={data.bankAccountNumber} onChange={onChange} required disabled />
        <Field label="Confirm Account Number" name="bankAccountNumberConfirm" value={data.bankAccountNumberConfirm} onChange={onChange} required disabled />
        <Field label="IFSC Code" name="bankIfsc" value={data.bankIfsc} onChange={onChange} required disabled />
        <Field label="Confirm IFSC Code" name="bankIfscConfirm" value={data.bankIfscConfirm} onChange={onChange} required disabled />
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
      <Field label="PAN Card" name="pan" value={data.pan} onChange={onChange} required disabled />
      <Field label="Confirm PAN Card" name="panConfirm" value={data.panConfirm} onChange={onChange} required disabled />
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
      <div><strong>Nature of Programme:</strong> {meta.programme_nature || meta.nature_of_programme || "—"}</div>
            <div><strong>Title of Programme:</strong> {meta.programme_title || meta.title_of_programme || "—"}</div>
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
                <span className="font-bold text-[10px] uppercase block text-gray-500 mb-0.5">Local Journey</span>
                <div>From {meta.local_journey_from} to {meta.local_journey_to} via {meta.local_journey_mode} (₹ {Number(meta.local_journey_amount).toLocaleString("en-IN")})</div>
              </div>
            )}
            <div className="sm:col-span-2 border-t pt-1.5 mt-1.5">
              <div className="font-bold text-sm">Gross Total: ₹ {Number(meta.grand_total || meta.amount).toLocaleString("en-IN")}</div>
              <div className="text-sm text-gray-600">Net Amount (after TDS): ₹ {Number(meta.amount_after_tds || meta.amountAfterTds || (meta.amount * 0.9)).toLocaleString("en-IN")}</div>
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

  // ── KYC State ──────────────────────────────────────────────────────────────
  // Step 1: Aadhaar OTP (OKYC)
  const [aadhaar, setAadhaar] = useState("");
  const [aadhaarRefId, setAadhaarRefId] = useState(null);
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [aadhaarName, setAadhaarName] = useState(null);   // name returned from OKYC
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [aadhaarStep, setAadhaarStep] = useState("input"); // "input" | "otp" | "done"
  const [aadhaarLoading, setAadhaarLoading] = useState(false);
  const [aadhaarError, setAadhaarError] = useState(null);

  // Step 2: PAN
  const [panVerified, setPanVerified] = useState(false);
  const [panName, setPanName] = useState(null);
  const [panLoading, setPanLoading] = useState(false);
  const [panError, setPanError] = useState(null);
  const [nameMatchOk, setNameMatchOk] = useState(null);      // Aadhaar↔PAN match: null|true|false
  const [nameMatchScore, setNameMatchScore] = useState(null); // Aadhaar↔PAN similarity %

  // Step 3: Bank Account Verification
  const [bankVerified, setBankVerified] = useState(false);
  const [bankName, setBankName] = useState(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState(null);
  const [bankMatchResult, setBankMatchResult] = useState(null); // best-2-of-3 result

  // KYC fully passed = all 3 verified + best-2-of-3 name match passed
  const kycPassed = aadhaarVerified && panVerified && nameMatchOk === true && bankVerified && bankMatchResult?.passed === true;

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
          bankBeneficiaryName: data.kyc_aadhaar_name || "",
          bankAccountNumber: "",
          bankAccountNumberConfirm: "",
          bankName: "",
          bankIfsc: "",
          bankIfscConfirm: "",
          bankBranchAddress: ""
        });
        
        // Restore KYC state if verified
        if (data.kyc_aadhaar_verified) {
          setAadhaarVerified(true);
          setAadhaarName(data.kyc_aadhaar_name);
          setAadhaarStep("done");
        } else if (data.kyc_aadhaar_ref_id) {
          // If they generated an OTP but refreshed before verifying
          setAadhaarRefId(data.kyc_aadhaar_ref_id);
          setAadhaarStep("otp");
        }
        if (data.kyc_pan_verified) {
          setPanVerified(true);
          setPanName(data.kyc_pan_name);
          setNameMatchScore(data.kyc_pan_match_score);
          setNameMatchOk(data.kyc_pan_match_score !== null ? data.kyc_pan_match_score >= 60 : null);
          setFormData(prev => ({ ...prev, pan: data.kyc_pan_number || "", panConfirm: data.kyc_pan_number || "" }));
        }
        if (data.kyc_bank_verified) {
          setBankVerified(true);
          setBankName(data.kyc_bank_name);
          setBankMatchResult(data.kyc_bank_match);
          setFormData(prev => ({ 
            ...prev, 
            bankAccountNumber: data.kyc_bank_account || "", 
            bankAccountNumberConfirm: data.kyc_bank_account || "",
            bankIfsc: data.kyc_bank_ifsc || "",
            bankIfscConfirm: data.kyc_bank_ifsc || ""
          }));
        }
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

  // ── KYC Handlers ───────────────────────────────────────────────────────────

  async function handleAadhaarGenerateOtp() {
    setAadhaarError(null);
    if (!/^\d{12}$/.test(aadhaar.trim())) {
      setAadhaarError("Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    setAadhaarLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/verify/aadhaar/generate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar: aadhaar.trim(), token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP.");
      setAadhaarRefId(data.ref_id);
      setAadhaarStep("otp");
    } catch (err) {
      setAadhaarError(err.message);
    } finally {
      setAadhaarLoading(false);
    }
  }

  async function handleAadhaarVerifyOtp() {
    setAadhaarError(null);
    if (!/^\d{6}$/.test(aadhaarOtp.trim())) {
      setAadhaarError("OTP must be exactly 6 digits.");
      return;
    }
    setAadhaarLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/verify/aadhaar/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref_id: aadhaarRefId, otp: aadhaarOtp.trim(), token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed.");
      setAadhaarName(data.aadhaar_name);
      setAadhaarVerified(true);
      setAadhaarStep("done");
      // Auto-fill beneficiary name from Aadhaar name
      setFormData((prev) => ({ ...prev, bankBeneficiaryName: data.aadhaar_name }));
    } catch (err) {
      setAadhaarError(err.message);
    } finally {
      setAadhaarLoading(false);
    }
  }

  async function handlePanVerify() {
    setPanError(null);
    setNameMatchOk(null);
    setNameMatchScore(null);
    const pan = formData.pan?.trim();
    const PAN_REGEX = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/;
    if (!pan || !PAN_REGEX.test(pan)) {
      setPanError("Please enter a valid PAN (e.g. ABCDE1234F).");
      return;
    }
    if (!aadhaarVerified) {
      setPanError("Please complete Aadhaar verification first.");
      return;
    }
    setPanLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/verify/pan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pan, aadhaar_name: aadhaarName, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "PAN verification failed.");
      setPanName(data.pan_name);
      setPanVerified(true);
      setNameMatchOk(data.name_match);
      setNameMatchScore(data.name_match_score ?? null);
      if (data.name_match === false) {
        setPanError(data.name_match_message);
      }
    } catch (err) {
      setPanError(err.message);
    } finally {
      setPanLoading(false);
    }
  }

  async function handleBankVerify() {
    setBankError(null);
    setBankVerified(false);
    setBankMatchResult(null);
    const accountNumber = formData.bankAccountNumber?.trim();
    const ifsc = formData.bankIfsc?.trim();

    if (!accountNumber || !/^[0-9]{6,}$/.test(accountNumber)) {
      setBankError("Please enter a valid bank account number (at least 6 digits).");
      return;
    }
    if (!ifsc || !/^[A-Za-z0-9]{6,11}$/.test(ifsc)) {
      setBankError("Please enter a valid IFSC code.");
      return;
    }
    if (!aadhaarVerified || !panVerified || nameMatchOk !== true) {
      setBankError("Please complete Aadhaar and PAN verification first.");
      return;
    }
    setBankLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/verify/bank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_number: accountNumber,
          ifsc,
          payee_name: meta?.name || "",
          aadhaar_name: aadhaarName,
          pan_name: panName,
          token,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Bank account verification failed.");
      setBankName(data.bank_name);
      setBankVerified(true);
      setBankMatchResult(data.match);
      if (data.match && !data.match.passed) {
        setBankError(data.message);
      }
    } catch (err) {
      setBankError(err.message);
    } finally {
      setBankLoading(false);
    }
  }


  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    // KYC gate — must pass before submission
    if (!kycPassed) {
      setFormError("Please complete Aadhaar, PAN, and Bank Account verification before submitting.");
      setSubmitting(false);
      return;
    }

    // Validate PAN/IFSC client-side
    const pan = formData.pan?.trim();

    const ifsc = formData.bankIfsc?.trim();

  const PAN_REGEX = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/;
    if (!pan || !PAN_REGEX.test(pan)) {
      setFormError("PAN Card must be 5 letters, 4 numbers, then 1 letter (e.g. ABCDE1234F).");
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

          {/* ── KYC Verification Section ─────────────────────────────────── */}
          <div>
            <h2 className="text-xs uppercase tracking-wider text-black font-bold mb-1 pb-1 border-b border-gray-100">
              Identity Verification (KYC)
            </h2>

            {/* ── Step 1: Aadhaar OTP ───────────────────────────────────── */}
            <div className={`border rounded-lg p-4 mb-3 ${aadhaarVerified ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${aadhaarVerified ? "bg-green-600 text-white" : "bg-black text-white"}`}>
                  {aadhaarVerified ? "✓" : "1"}
                </span>
                <span className="text-xs font-bold text-black">Aadhaar Verification (OKYC)</span>
                {aadhaarVerified && (
                  <span className="ml-auto text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    Verified — {aadhaarName}
                  </span>
                )}
              </div>

              {aadhaarStep === "input" && !aadhaarVerified && (
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-gray-600 block mb-1">Aadhaar Number *</label>
                    <input
                      type="text"
                      value={aadhaar}
                      onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                      placeholder="12-digit Aadhaar number"
                      maxLength={12}
                      onPaste={(e) => e.preventDefault()}
                      onCopy={(e) => e.preventDefault()}
                      autoComplete="off"
                      className="w-full border-b-2 border-gray-200 py-2 text-sm bg-transparent text-black focus:outline-none focus:border-black transition-colors tracking-widest"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAadhaarGenerateOtp}
                    disabled={aadhaarLoading || aadhaar.length !== 12}
                    className="bg-black text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    {aadhaarLoading ? "Sending…" : "Send OTP"}
                  </button>
                </div>
              )}

              {aadhaarStep === "otp" && !aadhaarVerified && (
                <div className="space-y-3">
                  <p className="text-[11px] text-gray-600 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                    📱 An OTP has been sent to your Aadhaar-registered mobile number.
                  </p>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">Enter OTP *</label>
                      <input
                        type="text"
                        value={aadhaarOtp}
                        onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6-digit OTP"
                        maxLength={6}
                        onPaste={(e) => e.preventDefault()}
                        autoComplete="off"
                        className="w-full border-b-2 border-gray-200 py-2 text-sm bg-transparent text-black focus:outline-none focus:border-black transition-colors tracking-widest"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAadhaarVerifyOtp}
                        disabled={aadhaarLoading || aadhaarOtp.length !== 6}
                        className="bg-black text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                      >
                        {aadhaarLoading ? "Verifying…" : "Verify OTP"}
                      </button>
                      <button
                        type="button"
                        onClick={handleAadhaarGenerateOtp}
                        disabled={aadhaarLoading}
                        className="bg-gray-200 text-gray-800 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAadhaarStep("input"); setAadhaarOtp(""); setAadhaarRefId(null); }}
                    className="text-[11px] text-gray-500 underline cursor-pointer"
                  >
                    ← Change Aadhaar number
                  </button>
                </div>
              )}

              {aadhaarError && (
                <p className="text-red-600 text-xs mt-2 bg-red-50 border border-red-200 rounded px-3 py-1.5">⚠ {aadhaarError}</p>
              )}
            </div>

            {/* ── Step 2: PAN Verification ──────────────────────────────── */}
            <div className={`border rounded-lg p-4 ${panVerified ? (nameMatchOk ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50") : "border-gray-200 bg-gray-50"}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${panVerified && nameMatchOk ? "bg-green-600 text-white" : panVerified && !nameMatchOk ? "bg-red-600 text-white" : "bg-gray-400 text-white"}`}>
                  {panVerified && nameMatchOk ? "✓" : panVerified && !nameMatchOk ? "✗" : "2"}
                </span>
                <span className="text-xs font-bold text-black">PAN Verification</span>
                {panVerified && nameMatchOk && (
                  <span className="ml-auto text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    Verified — {panName}
                  </span>
                )}
              </div>

              {!aadhaarVerified ? (
                <p className="text-[11px] text-gray-400 italic">Complete Aadhaar verification first.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">PAN Number *</label>
                      <input
                        type="text"
                        name="pan"
                        value={formData.pan || ""}
                        onChange={(e) => {
                          handleChange({ target: { name: "pan", value: e.target.value.toUpperCase() } });
                          setPanVerified(false);
                          setNameMatchOk(null);
                          setPanName(null);
                          setPanError(null);
                        }}
                        placeholder="e.g. ABCDE1234F"
                        maxLength={10}
                        onPaste={(e) => e.preventDefault()}
                        onCopy={(e) => e.preventDefault()}
                        autoComplete="off"
                        disabled={panVerified && nameMatchOk}
                        className="w-full border-b-2 border-gray-200 py-2 text-sm bg-transparent text-black focus:outline-none focus:border-black transition-colors tracking-widest uppercase disabled:text-gray-400 disabled:border-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handlePanVerify}
                      disabled={panLoading || !formData.pan || formData.pan.length !== 10 || panVerified}
                      className="bg-black text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                      {panLoading ? "Verifying…" : panVerified && nameMatchOk ? "Verified ✓" : "Verify PAN"}
                    </button>
                  </div>

                  {panVerified && nameMatchOk && (
                    <p className="text-green-700 text-xs bg-green-50 border border-green-200 rounded px-3 py-1.5">
                      ✓ Aadhaar ↔ PAN name match confirmed{nameMatchScore !== null ? ` (${nameMatchScore}% similarity)` : ""}.
                    </p>
                  )}

                  {panError && (
                    <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded px-3 py-1.5">
                      ⚠ {panError}
                      {nameMatchOk === false && (
                        <span className="block mt-1 font-semibold">Please use matching documents to proceed.</span>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ── Step 3: Bank Account Verification ─────────────────────── */}
            <div className={`border rounded-lg p-4 mb-3 ${
              bankVerified
                ? bankMatchResult?.passed
                  ? "border-green-300 bg-green-50"
                  : "border-red-300 bg-red-50"
                : "border-gray-200 bg-gray-50"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  bankVerified && bankMatchResult?.passed
                    ? "bg-green-600 text-white"
                    : bankVerified && !bankMatchResult?.passed
                    ? "bg-red-600 text-white"
                    : "bg-gray-400 text-white"
                }`}>
                  {bankVerified && bankMatchResult?.passed ? "✓" : bankVerified && !bankMatchResult?.passed ? "✗" : "3"}
                </span>
                <span className="text-xs font-bold text-black">Bank Account Verification</span>
                {bankVerified && bankMatchResult?.passed && (
                  <span className="ml-auto text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    Verified — {bankName}
                  </span>
                )}
              </div>

              {!aadhaarVerified || !panVerified || nameMatchOk !== true ? (
                <p className="text-[11px] text-gray-400 italic">Complete Aadhaar and PAN verification first.</p>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">Account Number *</label>
                      <input
                        type="text"
                        name="bankAccountNumber"
                        value={formData.bankAccountNumber || ""}
                        onChange={(e) => {
                          handleChange({ target: { name: "bankAccountNumber", value: e.target.value.replace(/\D/g, "") } });
                          setBankVerified(false);
                          setBankMatchResult(null);
                          setBankName(null);
                          setBankError(null);
                        }}
                        placeholder="Account number"
                        onPaste={(e) => e.preventDefault()}
                        onCopy={(e) => e.preventDefault()}
                        autoComplete="off"
                        disabled={bankVerified && bankMatchResult?.passed}
                        className="w-full border-b-2 border-gray-200 py-2 text-sm bg-transparent text-black focus:outline-none focus:border-black transition-colors disabled:text-gray-400 disabled:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">IFSC Code *</label>
                      <input
                        type="text"
                        name="bankIfsc"
                        value={formData.bankIfsc || ""}
                        onChange={(e) => {
                          handleChange({ target: { name: "bankIfsc", value: e.target.value.toUpperCase() } });
                          setBankVerified(false);
                          setBankMatchResult(null);
                          setBankName(null);
                          setBankError(null);
                        }}
                        placeholder="e.g. SBIN0001234"
                        maxLength={11}
                        onPaste={(e) => e.preventDefault()}
                        autoComplete="off"
                        disabled={bankVerified && bankMatchResult?.passed}
                        className="w-full border-b-2 border-gray-200 py-2 text-sm bg-transparent text-black focus:outline-none focus:border-black uppercase transition-colors disabled:text-gray-400 disabled:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleBankVerify}
                    disabled={bankLoading || !formData.bankAccountNumber || !formData.bankIfsc || bankVerified && bankMatchResult?.passed}
                    className="bg-black text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {bankLoading ? "Verifying…" : bankVerified && bankMatchResult?.passed ? "Verified ✓" : "Verify Bank Account"}
                  </button>

                  {/* ── Name Match Matrix ──────────────────────────────── */}
                  {bankVerified && bankMatchResult && (
                    <div className={`rounded-lg border p-3 text-xs ${bankMatchResult.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                      <p className={`font-bold mb-2 ${bankMatchResult.passed ? "text-green-800" : "text-red-800"}`}>
                        {bankMatchResult.passed
                          ? `✓ Name match passed — ${bankMatchResult.matchCount}/${bankMatchResult.totalPairs} pairs match (≥60%)`
                          : `✗ Name match failed — only ${bankMatchResult.matchCount}/${bankMatchResult.totalPairs} pairs match (need ≥3)`}
                      </p>
                      {/* Name reference row */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-gray-600 mb-2 bg-white/60 rounded px-2 py-1.5 border border-gray-100">
                        <span><b className="text-gray-800">Payee:</b> {meta?.name || "—"}</span>
                        <span><b className="text-gray-800">Aadhaar:</b> {aadhaarName}</span>
                        <span><b className="text-gray-800">PAN:</b> {panName}</span>
                        <span><b className="text-gray-800">Bank:</b> {bankName}</span>
                      </div>
                      <div className="space-y-1.5">
                        {/* Column headers */}
                        <div className="grid grid-cols-3 gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          <span>Pair</span>
                          <span>Similarity</span>
                          <span>Result</span>
                        </div>
                        {/* Helper to render one row */}
                        {[
                          { key: "payee_aadhaar", label: "Payee ↔ Aadhaar" },
                          { key: "payee_pan",     label: "Payee ↔ PAN"     },
                          { key: "payee_bank",    label: "Payee ↔ Bank"    },
                          { key: "aadhaar_pan",   label: "Aadhaar ↔ PAN"  },
                          { key: "aadhaar_bank",  label: "Aadhaar ↔ Bank" },
                          { key: "pan_bank",      label: "PAN ↔ Bank"     },
                        ].map(({ key, label }) => {
                          const p = bankMatchResult.pairs[key];
                          if (!p) return null;
                          return (
                            <div key={key} className="grid grid-cols-3 gap-1 items-center">
                              <span className={`text-gray-700 ${key.startsWith("payee") ? "font-semibold" : ""}`}>{label}</span>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${p.ok ? "bg-green-500" : "bg-red-400"}`}
                                  style={{ width: `${p.score}%` }}
                                />
                              </div>
                              <span className={`font-bold ${p.ok ? "text-green-700" : "text-red-600"}`}>
                                {p.score}% {p.ok ? "✓" : "✗"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {bankError && (
                    <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded px-3 py-1.5">
                      ⚠ {bankError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* KYC Status Banner */}
            {kycPassed && (
              <div className="mt-3 bg-green-600 text-white text-xs font-bold text-center py-2 rounded-lg">
                ✓ KYC Verified — Payee, Aadhaar, PAN &amp; Bank identity confirmed. You may now submit.
              </div>
            )}
          </div>


          {/* ── Personal Details (shown only after KYC passes) ────────────── */}
          {kycPassed && (
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
          )}


          {/* Bank Details — shown only after KYC passes */}
          {kycPassed && (
          <div>
            <h2 className="text-xs uppercase tracking-wider text-black font-bold mb-3 pb-1 border-b border-gray-100">
              Bank Account Details
            </h2>
            <p className="text-[11px] text-gray-500 mb-3">
              Account number and IFSC confirmed above. Please complete remaining fields.
            </p>
            <BankDetails data={formData} onChange={handleChange} />
          </div>
          )}

          {formError && (
            <p className="text-red-600 text-sm border-l-4 border-red-600 p-3 bg-red-50">{formError}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !kycPassed}
            className="w-full bg-black text-white text-sm font-bold py-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {submitting ? "Submitting…" : !kycPassed ? "Complete KYC (3 Steps) to Submit" : "Submit Verification & Bank Details"}
          </button>
        </form>


        <p className="text-center text-xs text-gray-500 mt-6">
          This form was sent to you by {SERVICE_LABELS[services]}. For queries, contact the accounts section.
        </p>
      </div>
    </div>
  );
}

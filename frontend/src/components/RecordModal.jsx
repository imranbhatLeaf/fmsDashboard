import React, { useState, useEffect } from 'react';

const CSV_FIELDS = [
  "name", "designation", "pay_level", "address", 
  "phone_office", "phone_mobile", "email", "programme_nature", "programme_title", 
  "participation_type", "lecture_type", "honorarium_basis", "num_presences", "rate", 
  "total_amount", "journey_from", "journey_to", "journey_mode", "journey_amount", 
  "local_journey_from", "local_journey_to", "local_journey_mode", "local_journey_amount", 
  "grand_total", "fellowship_rate", "fellowship_total", "refund_amount_claimed", 
  "payment_receipt_number", "payment_receipt_date", "refund_reason", "academic_year", 
  "amount",
  "entitled_amount", "entitled_amount_words", "expenditure_debitable_to", "treasurer_signature",
  "participation_payment_certified_by", "received_amount", "received_amount_words", "applicant_signature",
  "passed_for_payment_amount", "passed_for_payment_amount_words", "utr_rrn_reference_number",
  "payment_dated", "secretary_or_president_signature", "programme_applied_for", "refund_amount",
  "mobile_number", "applicant_name", "reason_for_refund",
  "fellowship_as_per_norms", "claimant_signature", "telephone_office", "telephone_mobile", "nature_of_programme", "title_of_programme", "rate", "total",
  "remarks", "journeyRows", "localJourneyRows",
  "nature_of_participation", "number_of_presences", "presences_unit", "honorarium_as_per_norms"
];

const REFUND_FIELDS_SPEC = {
  applicantInfo: [
    { label: "Applicant Name", name: "applicant_name", required: true, type: "text" },
    { label: "Address", name: "address", required: true, type: "text" },
    { label: "Email", name: "email", required: true, type: "email" },
  ],
  refundDetails: [
    { label: "Refund Amount (₹)", name: "refund_amount", required: true, type: "number" },
    { label: "Payment Receipt Number", name: "payment_receipt_number", required: true, type: "text" },
    { label: "Payment Receipt Date", name: "payment_receipt_date", required: true, type: "date" },
    { label: "Reason for Refund", name: "reason_for_refund", required: true, type: "text" },
    { label: "Programme Applied For", name: "programme_applied_for", required: true, type: "text" },
    { label: "Academic Year", name: "academic_year", required: true, type: "text" },
  ],
  officeUse: [
    { label: "Entitled Amount (₹)", name: "entitled_amount", type: "number" },
    { label: "Entitled Amount in Words", name: "entitled_amount_words", type: "text" },
    { label: "Expenditure Debitable To", name: "expenditure_debitable_to", type: "text" },
    { label: "Treasurer Signature/Status", name: "treasurer_signature", type: "text" },
    { label: "Certified By (Prog. Coordinator)", name: "participation_payment_certified_by", type: "text" },
    { label: "Received Amount (₹)", name: "received_amount", type: "number" },
    { label: "Received Amount in Words", name: "received_amount_words", type: "text" },
    { label: "Applicant Signature/Status", name: "applicant_signature", type: "text" },
    { label: "Passed for Payment Amount (₹)", name: "passed_for_payment_amount", type: "number" },
    { label: "Passed for Payment Amount in Words", name: "passed_for_payment_amount_words", type: "text" },
    { label: "UTR/RRN Reference Number", name: "utr_rrn_reference_number", type: "text" },
    { label: "Payment Dated", name: "payment_dated", type: "date" },
    { label: "Secretary/President Signature/Status", name: "secretary_or_president_signature", type: "text" },
  ]
};

const FELLOWSHIP_FIELDS_SPEC = {
  payeeInfo: [
    { label: "Payee Name", name: "name", required: true, type: "text" },
    { label: "Designation", name: "designation", required: true, type: "text" },
    { label: "Address", name: "address", required: true, type: "text" },
    { label: "Email", name: "email", required: true, type: "email" },
  ],
  programmeDetails: [
    { label: "Nature of Programme", name: "nature_of_programme", required: true, type: "text" },
    { label: "Title of Programme", name: "title_of_programme", required: true, type: "text" },
    { label: "Fellowship Amount (₹)", name: "total", required: true, type: "number" },
  ],
  officeUse: [
    { label: "Entitled Amount (₹)", name: "entitled_amount", type: "number" },
    { label: "Entitled Amount in Words", name: "entitled_amount_words", type: "text" },
    { label: "Expenditure Debitable To", name: "expenditure_debitable_to", type: "text" },
    { label: "Treasurer Signature/Status", name: "treasurer_signature", type: "text" },
    { label: "Certified By (Prog. Coordinator)", name: "participation_payment_certified_by", type: "text" },
    { label: "Received Amount (₹)", name: "received_amount", type: "number" },
    { label: "Received Amount in Words", name: "received_amount_words", type: "text" },
    { label: "Payee Signature/Status", name: "claimant_signature", type: "text" },
    { label: "Passed for Payment Amount (₹)", name: "passed_for_payment_amount", type: "number" },
    { label: "Passed for Payment Amount in Words", name: "passed_for_payment_amount_words", type: "text" },
    { label: "UTR/RRN Reference Number", name: "utr_rrn_reference_number", type: "text" },
    { label: "Payment Dated", name: "payment_dated", type: "date" },
    { label: "Secretary/President Signature/Status", name: "secretary_or_president_signature", type: "text" },
  ]
};

const SALARY_FIELDS_SPEC = {
  payeeInfo: [
    { label: "Payee Name", name: "name", required: true, type: "text" },
    { label: "Designation", name: "designation", required: true, type: "text" },
    { label: "Address", name: "address", required: true, type: "text" },
    { label: "Email", name: "email", required: true, type: "email" },
  ],
  salaryDetails: [
    { label: "Nature of Programme", name: "nature_of_programme", required: true, type: "text" },
    { label: "Title of Programme", name: "title_of_programme", required: true, type: "text" },
    { label: "Salary Amount (₹)", name: "total", required: true, type: "number" },
  ],
};

const TADA_FIELDS_SPEC = {
  payeeInfo: [
    { label: "Payee Name", name: "name", required: true, type: "text" },
    { label: "Designation", name: "designation", required: true, type: "text" },
    { label: "Address", name: "address", required: true, type: "text" },
    { label: "Email", name: "email", required: true, type: "email" },
  ],
  programmeDetails: [
    { label: "Nature of Programme", name: "nature_of_programme", required: true, type: "text" },
    { label: "Title of Programme", name: "title_of_programme", required: true, type: "text" }
  ],
  officeUse: [
    { label: "Entitled Amount (₹)", name: "entitled_amount", type: "number" },
    { label: "Entitled Amount in Words", name: "entitled_amount_words", type: "text" },
    { label: "Expenditure Debitable To", name: "expenditure_debitable_to", type: "text" },
    { label: "Treasurer Signature/Status", name: "treasurer_signature", type: "text" },
    { label: "Certified By (Prog. Coordinator)", name: "participation_payment_certified_by", type: "text" },
    { label: "Received Amount (₹)", name: "received_amount", type: "number" },
    { label: "Received Amount in Words", name: "received_amount_words", type: "text" },
    { label: "Payee Signature/Status", name: "claimant_signature", type: "text" },
    { label: "Passed for Payment Amount (₹)", name: "passed_for_payment_amount", type: "number" },
    { label: "Passed for Payment Amount in Words", name: "passed_for_payment_amount_words", type: "text" },
    { label: "UTR/RRN Reference Number", name: "utr_rrn_reference_number", type: "text" },
    { label: "Payment Dated", name: "payment_dated", type: "date" },
    { label: "Secretary/President Signature/Status", name: "secretary_or_president_signature", type: "text" },
  ]
};

const HONORARIUM_FIELDS_SPEC = {
  payeeInfo: [
    { label: "Payee Name", name: "name", required: true, type: "text" },
    { label: "Designation", name: "designation", required: true, type: "text" },
    { label: "Address", name: "address", required: true, type: "text" },
    { label: "Email", name: "email", required: true, type: "email" },
  ],
  programmeDetails: [
    { label: "Nature of Programme", name: "nature_of_programme", required: true, type: "text" },
    { label: "Title of Programme", name: "title_of_programme", required: true, type: "text" },
    { label: "Nature of Participation", name: "nature_of_participation", required: true, type: "select", options: ["Expert", "Resource Person"] },
    { label: "Lecture Type", name: "lecture_type", required: true, type: "select", options: ["Online", "Offline"] },
    { label: "Honorarium Basis", name: "honorarium_basis", required: true, type: "select", options: ["Per Hour", "Per Day"] },
    { label: "Number of Presences", name: "number_of_presences", required: true, type: "number" },
    { label: "Presences Unit", name: "presences_unit", required: true, type: "select", options: ["Day", "Hours"] },
    { label: "Honorarium as per Norms", name: "honorarium_as_per_norms", required: true, type: "text" },
    { label: "Rate (₹)", name: "rate", required: true, type: "number" },
    { label: "Total Honorarium (₹)", name: "total", required: true, type: "number" },
  ],
  officeUse: [
    { label: "Entitled Amount (₹)", name: "entitled_amount", type: "number" },
    { label: "Entitled Amount in Words", name: "entitled_amount_words", type: "text" },
    { label: "Expenditure Debitable To", name: "expenditure_debitable_to", type: "text" },
    { label: "Treasurer Signature/Status", name: "treasurer_signature", type: "text" },
    { label: "Certified By (Prog. Coordinator)", name: "participation_payment_certified_by", type: "text" },
    { label: "Received Amount (₹)", name: "received_amount", type: "number" },
    { label: "Received Amount in Words", name: "received_amount_words", type: "text" },
    { label: "Payee Signature/Status", name: "claimant_signature", type: "text" },
    { label: "Passed for Payment Amount (₹)", name: "passed_for_payment_amount", type: "number" },
    { label: "Passed for Payment Amount in Words", name: "passed_for_payment_amount_words", type: "text" },
    { label: "UTR/RRN Reference Number", name: "utr_rrn_reference_number", type: "text" },
    { label: "Payment Dated", name: "payment_dated", type: "date" },
    { label: "Secretary/President Signature/Status", name: "secretary_or_president_signature", type: "text" },
  ]
};

export default function RecordModal({ record, onClose, onSave, defaultFormType }) {
  const isAdd = !record;
  const [selectedFormType, setSelectedFormType] = useState(
    record?.form_type === 'refund' || record?.category === 'Refund' 
      ? 'refund' 
      : record?.form_type === 'fellowship' || record?.category === 'Fellowship'
      ? 'fellowship'
      : record?.form_type === 'tada' || record?.category === 'TA/DA'
      ? 'tada'
      : record?.form_type === 'honorarium' || record?.category === 'Honorarium'
      ? 'honorarium'
      : record?.form_type === 'salary' || record?.category === 'Salary'
      ? 'salary'
      : (defaultFormType || 'standard')
  );
  const [isEditing, setIsEditing] = useState(isAdd);
  const [formData, setFormData] = useState(record || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // TA/DA Repeatable Rows States
  const [journeyRows, setJourneyRows] = useState([]);
  const [localJourneyRows, setLocalJourneyRows] = useState([]);

  useEffect(() => {
    if (selectedFormType === 'tada') {
      setJourneyRows(formData.journeyRows && formData.journeyRows.length > 0 ? formData.journeyRows : [{ journey_from_date: '', journey_from: '', journey_to_date: '', journey_to: '', journey_mode: 'Road', journey_amount: '' }]);
      setLocalJourneyRows(formData.localJourneyRows && formData.localJourneyRows.length > 0 ? formData.localJourneyRows : [{ local_journey_date: '', local_journey_from: '', local_journey_to: '', local_journey_mode: 'Bus', local_journey_amount: '' }]);
    }
  }, [selectedFormType, formData.journeyRows, formData.localJourneyRows]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleJourneyChange = (index, field, val) => {
    const updated = [...journeyRows];
    updated[index][field] = val;
    setJourneyRows(updated);
  };

  const handleLocalJourneyChange = (index, field, val) => {
    const updated = [...localJourneyRows];
    updated[index][field] = val;
    setLocalJourneyRows(updated);
  };

  const addJourneyRow = () => {
    setJourneyRows([...journeyRows, { journey_from_date: '', journey_from: '', journey_to_date: '', journey_to: '', journey_mode: 'Road', journey_amount: '' }]);
  };

  const removeJourneyRow = (index) => {
    setJourneyRows(journeyRows.filter((_, i) => i !== index));
  };

  const addLocalJourneyRow = () => {
    setLocalJourneyRows([...localJourneyRows, { local_journey_date: '', local_journey_from: '', local_journey_to: '', local_journey_mode: 'Bus', local_journey_amount: '' }]);
  };

  const removeLocalJourneyRow = (index) => {
    setLocalJourneyRows(localJourneyRows.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let dataToSave = { ...formData };
      const emailVal = formData.email || '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailVal && !emailRegex.test(emailVal)) {
        setError('Please enter a valid email address.');
        setSaving(false);
        return;
      }
      const nameValInput = formData.name || '';
      if (nameValInput && !/^[a-zA-Z\s]+$/.test(nameValInput)) {
        setError('Name must contain only letters and spaces.');
        setSaving(false);
        return;
      }
      const addressVal = formData.address || '';
      if (addressVal && !/[a-zA-Z]/.test(addressVal)) {
        setError('Address must contain at least one letter.');
        setSaving(false);
        return;
      }
      if (addressVal && /[^a-zA-Z0-9\s,.\/\-]/.test(addressVal)) {
        setError('Address must not contain special characters.');
        setSaving(false);
        return;
      }
      const natureVal = formData.nature_of_programme || formData.natureOfProgramme || '';
      if (natureVal && !/^[a-zA-Z0-9\s]+$/.test(natureVal)) {
        setError('Nature of Programme must not contain special characters.');
        setSaving(false);
        return;
      }
      if (natureVal && !/[a-zA-Z]/.test(natureVal)) {
        setError('Nature of Programme must contain at least one letter.');
        setSaving(false);
        return;
      }
      const titleVal = formData.title_of_programme || formData.titleOfProgramme || '';
      if (titleVal && !/^[a-zA-Z0-9\s]+$/.test(titleVal)) {
        setError('Title of Programme must not contain special characters.');
        setSaving(false);
        return;
      }
      if (titleVal && !/[a-zA-Z]/.test(titleVal)) {
        setError('Title of Programme must contain at least one letter.');
        setSaving(false);
        return;
      }

      // ── Validation ──────────────────────────────────────────────
      // Name & Designation: letters, spaces, dots, hyphens only (no numbers or special chars)
      const NAME_REGEX = /^[A-Za-z .\-']+$/;
      const nameVal = (dataToSave.name || dataToSave.applicant_name || "").trim();
      if (nameVal && !NAME_REGEX.test(nameVal)) {
        setError("Name must contain only letters (no numbers or special characters).");
        setSaving(false);
        return;
      }
      const desigVal = (dataToSave.designation || "").trim();
      if (desigVal && desigVal !== "N/A" && !NAME_REGEX.test(desigVal)) {
        setError("Designation must contain only letters (no numbers or special characters).");
        setSaving(false);
        return;
      }

      // Mobile number: exactly 10 digits
      const mobileVal = (dataToSave.phone_mobile || dataToSave.mobile_number || "").trim();
      if (mobileVal && mobileVal !== "N/A" && !/^\d{10}$/.test(mobileVal)) {
        setError("Mobile Number must be exactly 10 digits (numbers only).");
        setSaving(false);
        return;
      }

      // Nature of Programme & Title (min 4 chars) — for all non-refund forms
      if (selectedFormType !== 'refund') {
        const natureVal = (dataToSave.nature_of_programme || dataToSave.programme_nature || "").trim();
        if (natureVal && natureVal.length < 4) {
          setError("Nature of Programme must be at least 4 characters.");
          setSaving(false);
          return;
        }
        const titleVal = (dataToSave.title_of_programme || dataToSave.programme_title || "").trim();
        if (titleVal && titleVal.length < 4) {
          setError("Title of Programme must be at least 4 characters.");
          setSaving(false);
          return;
        }
      }
      // ────────────────────────────────────────────────────────────

      // Auto-set the backend services field to keep it in sync with component
      dataToSave.services = dataToSave.component;

      if (selectedFormType === 'refund') {
        dataToSave.form_type = 'refund';
        dataToSave.category = 'Refund';
        // Auto-fill core fields for compatibility
        dataToSave.name = formData.applicant_name || formData.name;
        dataToSave.email = formData.email;
        dataToSave.address = formData.address;
        dataToSave.phone_mobile = formData.mobile_number || formData.phone_mobile;
        dataToSave.amount = Number(formData.passed_for_payment_amount || formData.refund_amount || formData.amount || 0);
        dataToSave.refund_amount_claimed = Number(formData.refund_amount || formData.refund_amount_claimed || 0);
        dataToSave.refund_reason = formData.reason_for_refund || formData.refund_reason;
        dataToSave.academic_year = formData.academic_year;
        dataToSave.programme_title = formData.programme_applied_for || formData.programme_title;
      } else if (selectedFormType === 'fellowship') {
        if (!formData.component && !formData.services) {
          setError('Component is required. Please select a component.');
          setSaving(false);
          return;
        }
        if (!formData.nature_of_programme && !formData.natureOfProgramme) {
          setError('Nature of Programme is required. Please enter the nature of programme.');
          setSaving(false);
          return;
        }
        if (!formData.title_of_programme && !formData.titleOfProgramme) {
          setError('Title of Programme is required. Please enter the title of programme.');
          setSaving(false);
          return;
        }
        if (!formData.total || Number(formData.total) <= 0) {
          setError('Fellowship Amount must be greater than 0.');
          setSaving(false);
          return;
        }
        dataToSave.form_type = 'fellowship';
        dataToSave.category = 'Fellowship';
        // Auto-fill core fields for compatibility
        dataToSave.name = formData.name;
        dataToSave.email = formData.email;
        dataToSave.designation = formData.designation;
        dataToSave.address = formData.address;
        dataToSave.phone_office = formData.telephone_office || formData.phone_office;
        dataToSave.phone_mobile = formData.telephone_mobile || formData.phone_mobile;
        dataToSave.programme_nature = formData.nature_of_programme || formData.programme_nature;
        dataToSave.programme_title = formData.title_of_programme || formData.programme_title;
        dataToSave.total_amount = Number(formData.total || 0);
        dataToSave.amount = Number(formData.passed_for_payment_amount || formData.total || formData.amount || 0);
        dataToSave.claimant_signature = formData.claimant_signature;
      } else if (selectedFormType === 'tada') {
        dataToSave.form_type = 'tada';
        dataToSave.category = 'TA/DA';
        // Journey tables
        dataToSave.journeyRows = journeyRows;
        dataToSave.localJourneyRows = localJourneyRows;
        // Calculation
        const journeySum = journeyRows.reduce((acc, row) => acc + Number(row.journey_amount || 0), 0);
        const localSum = localJourneyRows.reduce((acc, row) => acc + Number(row.local_journey_amount || 0), 0);
        dataToSave.grand_total = journeySum + localSum;
        dataToSave.amount = Number(formData.passed_for_payment_amount || dataToSave.grand_total);
        dataToSave.claimant_signature = formData.claimant_signature;
      } else if (selectedFormType === 'salary') {
        if (!formData.component && !formData.services) {
          setError('Component is required. Please select a component.');
          setSaving(false);
          return;
        }
        if (!formData.nature_of_programme && !formData.natureOfProgramme) {
          setError('Nature of Programme is required. Please enter the nature of programme.');
          setSaving(false);
          return;
        }
        if (!formData.title_of_programme && !formData.titleOfProgramme) {
          setError('Title of Programme is required. Please enter the title of programme.');
          setSaving(false);
          return;
        }
        if (!formData.amount && !formData.total) {
          setError('Salary Amount is required. Please enter a valid salary amount.');
          setSaving(false);
          return;
        }
        if ((formData.amount && Number(formData.amount) <= 0) || (formData.total && Number(formData.total) <= 0)) {
          setError('Salary Amount must be greater than 0.');
          setSaving(false);
          return;
        }
        dataToSave.form_type = 'salary';
        dataToSave.category = 'Salary';
        dataToSave.name = formData.name;
        dataToSave.email = formData.email;
        dataToSave.designation = formData.designation;
        dataToSave.address = formData.address;
        dataToSave.programme_nature = formData.nature_of_programme || formData.programme_nature;
        dataToSave.programme_title = formData.title_of_programme || formData.programme_title;
        dataToSave.total_amount = Number(formData.total || 0);
        dataToSave.amount = Number(formData.total || formData.amount || 0);
      } else if (selectedFormType === 'honorarium') {
        dataToSave.form_type = 'honorarium';
        dataToSave.category = 'Honorarium';
        // Auto-fill core fields for compatibility
        dataToSave.name = formData.name;
        dataToSave.email = formData.email;
        dataToSave.designation = formData.designation;
        dataToSave.address = formData.address;
        dataToSave.phone_office = formData.telephone_office || formData.phone_office;
        dataToSave.phone_mobile = formData.telephone_mobile || formData.phone_mobile;
        dataToSave.programme_nature = formData.nature_of_programme || formData.programme_nature;
        dataToSave.programme_title = formData.title_of_programme || formData.programme_title;
        dataToSave.participation_type = formData.nature_of_participation || formData.participation_type;
        dataToSave.lecture_type = formData.lecture_type;
        dataToSave.honorarium_basis = formData.honorarium_basis;
        dataToSave.num_presences = Number(formData.number_of_presences || 0);
        dataToSave.rate = Number(formData.rate || 0);
        dataToSave.total_amount = Number(formData.total || 0);
        dataToSave.amount = Number(formData.passed_for_payment_amount || formData.total || formData.amount || 0);
        dataToSave.presences_unit = formData.presences_unit;
        dataToSave.honorarium_as_per_norms = formData.honorarium_as_per_norms;
        dataToSave.claimant_signature = formData.claimant_signature;
      }
      await onSave(dataToSave);
    } catch (err) {
      setError(err.message || "Failed to save record.");
    } finally {
      setSaving(false);
    }
  };

  const renderInputField = (field) => {
    const name = field.name || field;
    const type = field.type || "text";
    if (name === 'form_type' || name === 'services' || name.toLowerCase().includes('signature') || name.toLowerCase().includes('utr') || name === 'bankReferenceNo' || type === 'date' || name.toLowerCase().includes('date') || name.toLowerCase().includes('dated')) return null; // hide services, form_type, signatures, UTRN & dates

    const label = field.label || name.replace(/_/g, ' ');
    const required = field.required;

    let val = formData[name] || "";
    if (name === 'component' && !val) {
      val = formData.services || "";
    }
    if (type === 'date' && val && val.includes('T')) {
      val = val.split('T')[0];
    }

    // Determine if it should be a select dropdown
    let options = field.options || null;
    if (!options) {
      if (name === 'component') {
        options = ["ASSSR", "VMI", "DHC", "JASSSR"];
      } else if (name === 'category') {
        options = ["Honorarium", "Salary", "Fellowship", "TA/DA", "Refund"];
      } else if (name.endsWith('signature') || name.endsWith('_signature')) {
        options = ["Yes", "No", "Pending"];
      }
    }

    if (options) {
      const isDisabled = name === 'category' && selectedFormType !== 'standard';
      return (
        <div key={name} className="flex flex-col">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <select
            name={name}
            value={val}
            onChange={handleChange}
            required={required}
            disabled={isDisabled}
            className={`border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-white ${isDisabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
          >
            <option value="">Select option...</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div key={name} className="flex flex-col">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={type === 'number' ? 'number' : type === 'date' ? 'date' : type === 'email' ? 'email' : 'text'}
          name={name}
          value={val}
          onChange={handleChange}
          required={required}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
        />
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity print:hidden" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden pointer-events-none">
        <div className="w-full max-w-3xl bg-[#FAF9F6] rounded-xl shadow-2xl overflow-y-auto max-h-[90vh] border border-gray-200 pointer-events-auto flex flex-col">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 className="text-lg font-bold">{isAdd ? "Add Record Entry" : "Record Details"}</h2>
            <div className="flex items-center gap-2">
              {!isAdd && !isEditing && (
                <>
                  <button
                    onClick={() => {
                      if (!formData.bankReferenceNo || !formData.dateOfTransfer) {
                        alert("Receipt cannot be generated or printed without Bank Reference Number and Date of Transfer.");
                        return;
                      }
                      window.open(`/receipt/${formData.token}`, '_blank');
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-white bg-black hover:bg-gray-800 px-3 py-1.5 rounded-md transition-colors print:hidden"
                  >
                    Print Receipt
                  </button>
                  {onSave && (
                    <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors print:hidden">Edit</button>
                  )}
                </>
              )}
              <button onClick={onClose} className="text-gray-500 hover:text-black print:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {isAdd && isEditing && (
              <div className="flex flex-col mb-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Form Entry Type</label>
                <select
                  value={selectedFormType}
                  onChange={(e) => {
                    setSelectedFormType(e.target.value);
                    // Default component and category based on entry type, but let them customize it!
                    const defaults = {
                      standard: { component: 'ASSSR', category: 'Salary' },
                      refund: { component: 'ASSSR', category: 'Refund' },
                      fellowship: { component: 'ASSSR', category: 'Fellowship' },
                      tada: { component: 'ASSSR', category: 'TA/DA' },
                      salary: { component: 'ASSSR', category: 'Salary' },
                      salary: { component: 'ASSSR', category: 'Salary' },
                      honorarium: { component: 'ASSSR', category: 'Honorarium' },
                    }[e.target.value] || { component: 'ASSSR', category: 'Salary' };
                    setFormData(defaults);
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black animate-fadeIn"
                >
                  <option value="salary">Salary Form</option>
                  <option value="refund">Refund Form</option>
                  <option value="fellowship">Fellowship Bill Form</option>
                  <option value="tada">Travelling & TA/DA Form</option>
                  <option value="honorarium">Honorarium Bill Form</option>
                </select>
              </div>
            )}

            {/* Global Component and Category Header */}
            {isEditing ? (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderInputField({ name: "component", label: "Component", required: true })}
                {renderInputField({ name: "category", label: "Category/Payment Type", required: true })}
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Component</span>
                  <span className="text-sm font-semibold">{formData.component || formData.services || "N/A"}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Category</span>
                  <span className="text-sm font-semibold">{formData.category || "N/A"}</span>
                </div>
              </div>
            )}

            {!isEditing ? (
              <div className="space-y-4">
                {selectedFormType === 'refund' ? (
                  <>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 border-b pb-1.5 mb-2">Applicant Info</h3>
                      {REFUND_FIELDS_SPEC.applicantInfo.map(field => {
                        const val = formData[field.name] || formData[field.name.replace('_', '')] || formData[field.name === 'applicant_name' ? 'name' : field.name === 'mobile_number' ? 'phone_mobile' : ''];
                        if (!val) return null;
                        return (
                          <div key={field.name} className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">{field.label}:</span>
                            <span className="font-semibold text-gray-800">{val}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 border-b pb-1.5 mb-2">Refund Details</h3>
                      {REFUND_FIELDS_SPEC.refundDetails.map(field => {
                        let val = formData[field.name] || formData[field.name === 'refund_amount' ? 'refundAmountClaimed' : field.name === 'reason_for_refund' ? 'refundReason' : field.name === 'programme_applied_for' ? 'programmeTitle' : ''];
                        if (!val) return null;
                        if (field.type === 'date' && val.includes('T')) {
                          val = val.split('T')[0];
                        }
                        return (
                          <div key={field.name} className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">{field.label}:</span>
                            <span className="font-semibold text-gray-800">{val}</span>
                          </div>
                        );
                      })}
                    </div>

                  </>
                ) : selectedFormType === 'salary' ? (
                  <>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 border-b pb-1.5 mb-2">Payee Info</h3>
                      {SALARY_FIELDS_SPEC.payeeInfo.map(field => {
                        const val = formData[field.name];
                        if (!val) return null;
                        return (
                          <div key={field.name} className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">{field.label}:</span>
                            <span className="font-semibold text-gray-800">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 border-b pb-1.5 mb-2">Salary Details</h3>
                      {SALARY_FIELDS_SPEC.salaryDetails.map(field => {
                        let val = formData[field.name] || formData[field.name === 'nature_of_programme' ? 'programme_nature' : field.name === 'title_of_programme' ? 'programme_title' : field.name === 'total' ? 'total_amount' : ''];
                        if (!val) return null;
                        return (
                          <div key={field.name} className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">{field.label}:</span>
                            <span className="font-semibold text-gray-800">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : selectedFormType === 'fellowship' ? (
                  <>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 border-b pb-1.5 mb-2">Payee Info</h3>
                      {FELLOWSHIP_FIELDS_SPEC.payeeInfo.map(field => {
                        const val = formData[field.name];
                        if (!val) return null;
                        return (
                          <div key={field.name} className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">{field.label}:</span>
                            <span className="font-semibold text-gray-800">{val}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 border-b pb-1.5 mb-2">Programme Details</h3>
                      {FELLOWSHIP_FIELDS_SPEC.programmeDetails.map(field => {
                        let val = formData[field.name] || formData[field.name === 'nature_of_programme' ? 'programme_nature' : field.name === 'title_of_programme' ? 'programme_title' : field.name === 'total' ? 'total_amount' : ''];
                        if (!val) return null;
                        return (
                          <div key={field.name} className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">{field.label}:</span>
                            <span className="font-semibold text-gray-800">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : selectedFormType === 'tada' ? (
                  <>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 border-b pb-1.5 mb-2">Payee Info</h3>
                      {TADA_FIELDS_SPEC.payeeInfo.map(field => {
                        const val = formData[field.name];
                        if (!val) return null;
                        return (
                          <div key={field.name} className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">{field.label}:</span>
                            <span className="font-semibold text-gray-800">{val}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 border-b pb-1.5 mb-2">Programme Details</h3>
                      {TADA_FIELDS_SPEC.programmeDetails.map(field => {
                        const val = formData[field.name];
                        if (!val) return null;
                        return (
                          <div key={field.name} className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">{field.label}:</span>
                            <span className="font-semibold text-gray-800">{val}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 border-b pb-1.5 mb-2 font-serif">Journey Details</h3>
                      {journeyRows.map((row, idx) => (
                        <div key={idx} className="border-b pb-2 mb-2 text-sm grid grid-cols-2 gap-2">
                          <div><strong>From:</strong> {row.journey_from} {row.journey_from_date ? `(${new Date(row.journey_from_date).toLocaleDateString()})` : ''} <br/>➔ <strong>To:</strong> {row.journey_to} {row.journey_to_date ? `(${new Date(row.journey_to_date).toLocaleDateString()})` : ''}</div>
                          <div><strong>Mode:</strong> {row.journey_mode} <br/><strong>Amount:</strong> ₹{row.journey_amount}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 border-b pb-1.5 mb-2 font-serif">Local Journey Details</h3>
                      {localJourneyRows.map((row, idx) => (
                        <div key={idx} className="border-b pb-2 mb-2 text-sm grid grid-cols-2 gap-2">
                          <div><strong>Date:</strong> {row.local_journey_date ? new Date(row.local_journey_date).toLocaleDateString() : '—'} <br/><strong>From:</strong> {row.local_journey_from} ➔ <strong>To:</strong> {row.local_journey_to}</div>
                          <div><strong>Mode:</strong> {row.local_journey_mode} <br/><strong>Amount:</strong> ₹{row.local_journey_amount}</div>
                        </div>
                      ))}
                      <div className="pt-2 text-right font-bold text-gray-800">
                        Grand Total: ₹{(formData.grand_total || formData.grandTotal || 0).toLocaleString("en-IN")}
                      </div>
                      {formData.remarks && <div className="text-xs text-gray-500"><strong>Remarks:</strong> {formData.remarks}</div>}
                    </div>
                  </>
                ) : selectedFormType === 'honorarium' ? (
                  <>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 border-b pb-1.5 mb-2">Payee Info</h3>
                      {HONORARIUM_FIELDS_SPEC.payeeInfo.map(field => {
                        const val = formData[field.name];
                        if (!val) return null;
                        return (
                          <div key={field.name} className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">{field.label}:</span>
                            <span className="font-semibold text-gray-800">{val}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 border-b pb-1.5 mb-2 font-serif">Programme Details</h3>
                      {HONORARIUM_FIELDS_SPEC.programmeDetails.map(field => {
                        let val = formData[field.name] || formData[field.name === 'nature_of_programme' ? 'programme_nature' : field.name === 'title_of_programme' ? 'programme_title' : field.name === 'nature_of_participation' ? 'participation_type' : field.name === 'number_of_presences' ? 'num_presences' : field.name === 'total' ? 'total_amount' : ''];
                        if (!val) return null;
                        return (
                          <div key={field.name} className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">{field.label}:</span>
                            <span className="font-semibold text-gray-800">{val}</span>
                          </div>
                        );
                      })}
                    </div>

                  </>
                ) : (
                  <div className="space-y-3">
                    {CSV_FIELDS.map(field => {
                      if (formData[field] === undefined || formData[field] === null || formData[field] === "") return null;
                      if (field === 'form_type' || field === 'services' || field === 'component' || field === 'category') return null;
                      return (
                        <div key={field} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col">
                          <span className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1">{field.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-medium">{String(formData[field])}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {selectedFormType === 'refund' ? (
                  <>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-2">Applicant Info</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {REFUND_FIELDS_SPEC.applicantInfo.map(renderInputField)}
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-2">Refund Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {REFUND_FIELDS_SPEC.refundDetails.map(renderInputField)}
                      </div>
                    </div>

                  </>
                ) : selectedFormType === 'salary' ? (
                  <>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-2">Payee Info</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {SALARY_FIELDS_SPEC.payeeInfo.map(renderInputField)}
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-2">Salary Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {SALARY_FIELDS_SPEC.salaryDetails.map(renderInputField)}
                      </div>
                    </div>
                  </>
                ) : selectedFormType === 'fellowship' ? (
                  <>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-2">Payee Info</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {FELLOWSHIP_FIELDS_SPEC.payeeInfo.map(renderInputField)}
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-2">Programme Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {FELLOWSHIP_FIELDS_SPEC.programmeDetails.map(renderInputField)}
                      </div>
                    </div>

                  </>
                ) : selectedFormType === 'tada' ? (
                  <>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-2">Payee Info</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {TADA_FIELDS_SPEC.payeeInfo.map(renderInputField)}
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-2">Programme Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {TADA_FIELDS_SPEC.programmeDetails.map(renderInputField)}
                      </div>
                    </div>

                    {/* Journey Details Repeatable Rows */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b pb-2 mb-2">
                        <h3 className="text-sm font-bold text-gray-800">Journey Details</h3>
                        <button type="button" onClick={addJourneyRow} className="text-xs font-bold text-indigo-600 hover:underline">+ Add Row</button>
                      </div>
                      {journeyRows.map((row, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end border-b pb-3 mb-3">
                          <div className="md:col-span-1 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500">From Date</label>
                            <input type="date" value={row.journey_from_date || ''} onChange={(e) => handleJourneyChange(index, 'journey_from_date', e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-black" />
                          </div>
                          <div className="md:col-span-1 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500">From *</label>
                            <input type="text" value={row.journey_from} onChange={(e) => handleJourneyChange(index, 'journey_from', e.target.value)} required className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-black" />
                          </div>
                          <div className="md:col-span-1 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500">To Date</label>
                            <input type="date" value={row.journey_to_date || ''} onChange={(e) => handleJourneyChange(index, 'journey_to_date', e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-black" />
                          </div>
                          <div className="md:col-span-1 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500">To *</label>
                            <input type="text" value={row.journey_to} onChange={(e) => handleJourneyChange(index, 'journey_to', e.target.value)} required className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-black" />
                          </div>
                          <div className="md:col-span-1 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500">Mode *</label>
                            <select value={row.journey_mode} onChange={(e) => handleJourneyChange(index, 'journey_mode', e.target.value)} required className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-black">
                              <option value="Road">Road</option>
                              <option value="Rail">Rail</option>
                              <option value="Air">Air</option>
                            </select>
                          </div>
                          <div className="md:col-span-1 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500">Amount (₹) *</label>
                            <input type="number" value={row.journey_amount} onChange={(e) => handleJourneyChange(index, 'journey_amount', e.target.value)} required className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-black" />
                          </div>
                          <div className="md:col-span-1">
                            {journeyRows.length > 1 && (
                              <button type="button" onClick={() => removeJourneyRow(index)} className="text-xs text-red-500 hover:underline">Remove</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Local Journey Details Repeatable Rows */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b pb-2 mb-2">
                        <h3 className="text-sm font-bold text-gray-800">Local Journey Details</h3>
                        <button type="button" onClick={addLocalJourneyRow} className="text-xs font-bold text-indigo-600 hover:underline">+ Add Row</button>
                      </div>
                      {localJourneyRows.map((row, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end border-b pb-3 mb-3">
                          <div className="md:col-span-1 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500">Date</label>
                            <input type="date" value={row.local_journey_date || ''} onChange={(e) => handleLocalJourneyChange(index, 'local_journey_date', e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-black" />
                          </div>
                          <div className="md:col-span-1 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500">From *</label>
                            <input type="text" value={row.local_journey_from} onChange={(e) => handleLocalJourneyChange(index, 'local_journey_from', e.target.value)} required className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-black" />
                          </div>
                          <div className="md:col-span-1 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500">To *</label>
                            <input type="text" value={row.local_journey_to} onChange={(e) => handleLocalJourneyChange(index, 'local_journey_to', e.target.value)} required className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-black" />
                          </div>
                          <div className="md:col-span-1 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500">Mode *</label>
                            <select value={row.local_journey_mode} onChange={(e) => handleLocalJourneyChange(index, 'local_journey_mode', e.target.value)} required className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-black">
                              <option value="Bus">Bus</option>
                              <option value="Taxi">Taxi</option>
                              <option value="Car">Car</option>
                            </select>
                          </div>
                          <div className="md:col-span-1 flex flex-col">
                            <label className="text-[10px] font-bold text-gray-500">Amount (₹) *</label>
                            <input type="number" value={row.local_journey_amount} onChange={(e) => handleLocalJourneyChange(index, 'local_journey_amount', e.target.value)} required className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-black" />
                          </div>
                          <div className="md:col-span-1">
                            {localJourneyRows.length > 1 && (
                              <button type="button" onClick={() => removeLocalJourneyRow(index)} className="text-xs text-red-500 hover:underline">Remove</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-2">Remarks & Grand Total</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col">
                          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Remarks</label>
                          <textarea name="remarks" value={formData.remarks || ""} onChange={handleChange} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black h-20" />
                        </div>
                      </div>
                    </div>

                  </>
                ) : selectedFormType === 'honorarium' ? (
                  <>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-2">Payee Info</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {HONORARIUM_FIELDS_SPEC.payeeInfo.map(renderInputField)}
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-2">Programme Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {HONORARIUM_FIELDS_SPEC.programmeDetails.map(renderInputField)}
                      </div>
                    </div>

              
                  </>
                ) : (
                  <div className="space-y-4">
                    {CSV_FIELDS.map(field => renderInputField(field))}
                  </div>
                )}

                {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}
                
                <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-[#FAF9F6] pb-4 z-10 border-t border-gray-100">
                  {!isAdd && (
                    <button onClick={() => setIsEditing(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-white transition-colors">
                      Cancel
                    </button>
                  )}
                  <button onClick={handleSave} disabled={saving} className="text-sm font-semibold px-5 py-2 rounded-lg text-white bg-black hover:bg-gray-800 transition-colors disabled:opacity-50">
                    {saving ? "Saving..." : "Save Record"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

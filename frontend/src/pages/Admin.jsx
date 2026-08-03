import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logomain.avif";
import asssrLogo from "../assets/asssrFav.avif";
import headerImg from "../assets/header.png";
import RecordModal from "../components/RecordModal";
import PreviewModal from "../components/PreviewModal";
// Point this at your Express backend. In Vite, set VITE_API_BASE in your .env file.
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

const PAYMENT_TYPES = [
  { key: "Salary" },
  { key: "Honorarium" },
  { key: "Fellowship" },
  { key: "TA/DA" },
  { key: "Refund" },
];

// Black palette
const DB = "black";
const DB_HOVER = "#333";
const DB_ACTIVE = "#222";

export default function AdminDashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function handleResetPassword() {
    const newPassword = prompt("Enter new password (min 6 characters):");
    if (!newPassword) return;
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.token}`
        },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password.");
      alert("Password reset successfully.");
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAdminApprove(id) {
    try {
      const res = await fetch(`${API_BASE}/api/records/${id}/admin-approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${auth?.token}` }
      });
      if (!res.ok) throw new Error("Approval failed");
      setRecords((prev) => prev.map((r) => r._id === id ? { ...r, adminApproved: true, adminApprovedAt: new Date(), dateOfForwarding: new Date(), rejected: false } : r));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAdminReject(id) {
    setRejectModal({ id });
    setRejectReason("");
    setRejectSubmitting(false);
  }

  async function submitReject() {
    if (!rejectReason.trim()) return;
    setRejectSubmitting(true);
    const id = rejectModal.id;
    try {
      const res = await fetch(`${API_BASE}/api/records/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth?.token}` },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      if (!res.ok) throw new Error("Rejection failed");
      const updated = await res.json();
      setRecords((prev) => prev.map((r) => r._id === id ? { ...r, ...updated } : r));
      setRejectModal(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setRejectSubmitting(false);
    }
  }

  // Process modal state
  const [processModal, setProcessModal] = useState(null); // null | { id, utrn }
  const [processBankRef, setProcessBankRef] = useState("");
  const [processDate, setProcessDate] = useState("");
  const [processSubmitting, setProcessSubmitting] = useState(false);
  const [processError, setProcessError] = useState("");

  // Admin approve confirmation modal state
  const [adminApproveModal, setAdminApproveModal] = useState(null); // null | { id, utrn }
  const [adminApproveSubmitting, setAdminApproveSubmitting] = useState(false);

  function openAdminApproveModal(record) {
    const utrn = record.utr_rrn_reference_number || record.utrRrnReferenceNumber || record.token || "—";
    setAdminApproveModal({ id: record._id, utrn });
    setAdminApproveSubmitting(false);
  }

  async function submitAdminApprove() {
    setAdminApproveSubmitting(true);
    const id = adminApproveModal.id;
    try {
      const res = await fetch(`${API_BASE}/api/records/${id}/admin-approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${auth?.token}` }
      });
      if (!res.ok) throw new Error("Approval failed");
      setRecords((prev) => prev.map((r) => r._id === id ? { ...r, adminApproved: true, adminApprovedAt: new Date(), dateOfForwarding: new Date(), rejected: false } : r));
      setAdminApproveModal(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setAdminApproveSubmitting(false);
    }
  }

  // Reject modal state
  const [rejectModal, setRejectModal] = useState(null); // null | { id }
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  function openProcessModal(record) {
    const utrn = record.utr_rrn_reference_number || record.utrRrnReferenceNumber || record.bankReferenceNo || "—";
    setProcessModal({ id: record._id, utrn });
    setProcessBankRef("");
    // Default date to today
    setProcessDate(new Date().toISOString().slice(0, 10));
    setProcessError("");
    setProcessSubmitting(false);
  }

  async function handleProcessSubmit() {
    if (!processBankRef.trim()) {
      setProcessError("Bank Reference No is required.");
      return;
    }
    // Bank Reference must be alphanumeric only
    if (!/^[A-Za-z0-9]+$/.test(processBankRef.trim())) {
      setProcessError("Bank Reference No must contain only letters and numbers (no spaces or special characters).");
      return;
    }
    if (!processDate) {
      setProcessError("Date of Transfer is required.");
      return;
    }
    setProcessSubmitting(true);
    setProcessError("");
    try {
      const res = await fetch(`${API_BASE}/api/records/${processModal.id}/process`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.token}`
        },
        body: JSON.stringify({ bankReferenceNo: processBankRef.trim(), dateOfTransfer: processDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Processing failed");
      setRecords((prev) => prev.map((r) => r._id === processModal.id ? {
        ...r,
        paymentProcessed: true,
        paymentProcessedAt: new Date(data.paymentProcessedAt || Date.now()),
        dateOfTransfer: data.dateOfTransfer,
        bankReferenceNo: data.bankReferenceNo,
        receiptNumber: data.receiptNumber || r.receiptNumber,
      } : r));
      setProcessModal(null);
    } catch (err) {
      setProcessError(err.message);
    } finally {
      setProcessSubmitting(false);
    }
  }

  function copyLink(token) {
    const link = `https://finance.asssr.org/track`;
    navigator.clipboard.writeText(link);}

  // Generic Add/Edit
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);
  const [initialFormType, setInitialFormType] = useState("standard");

  function openAddModal(formType = "standard") {
    setActiveRecord(null);
    setInitialFormType(formType);
    setShowRecordModal(true);
  }

  function openRecordModal(record) {
    setActiveRecord(record);
    setShowRecordModal(true);
  }

  async function handleSaveRecord(formData) {
    const isAdd = !activeRecord;
    const url = isAdd ? `${API_BASE}/api/records` : `${API_BASE}/api/records/${activeRecord._id}/edit`;
    const method = isAdd ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth?.token}`
      },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to save record");
    
    if (isAdd) {
      setRecords((prev) => [data, ...prev]);
    } else {
      setRecords((prev) => prev.map((r) => r._id === activeRecord._id ? data : r));
    }
    setShowRecordModal(false);
  }


  // "upload" shows the CSV upload screen; otherwise this holds "all" or a category key
  const [view, setView] = useState("upload");

  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState(null);
  const [previewRecord, setPreviewRecord] = useState(null);



  // Excel sorting configuration
  const [sortConfig, setSortConfig] = useState({ key: "dateOfEntry", direction: "desc" });

  const fetchRecords = useCallback(async () => {
    if (view === "upload") return;
    setRecordsLoading(true);
    setRecordsError(null);
    try {
      const query = view === "all" ? "" : `?category=${encodeURIComponent(view)}`;
      const res = await fetch(`${API_BASE}/api/records${query}`, {
        headers: { Authorization: `Bearer ${auth?.token}` }
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : data.records || []);
    } catch (err) {
      setRecordsError(err.message || "Couldn't load records.");
    } finally {
      setRecordsLoading(false);
    }
  }, [view, auth?.token]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  function handleFileChosen(selected) {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Please choose a .csv file.");
      return;
    }
    setUploadError(null);
    setUploadResult(null);
    setFile(selected);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    handleFileChosen(e.dataTransfer.files?.[0]);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth?.token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Upload failed (${res.status})`);
      setUploadResult(data);
      setFile(null);
    } catch (err) {
      setUploadError(err.message || "Upload failed. Check the file and try again.");
    } finally {
      setUploading(false);
    }
  }

  const navItemClasses = (active) =>
    `flex items-center gap-2.5 text-left bg-transparent border-none text-sm px-3 py-2 rounded-md cursor-pointer whitespace-nowrap shrink-0 transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50 focus-visible:outline-offset-2 ${
      active
        ? "bg-white/15 text-white font-semibold"
        : "text-white/65 hover:bg-white/10 hover:text-white"
    }`;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

  // Excel sorting functions
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getRecordStatus = (r) => {
    if (r.rejected) return "Rejected";
    if (r.paymentProcessed) return "Paid";
    if (r.registrarApproved) return "Approved by Registrar, Pending for Payment";
    if (r.adminApproved) return "Pending Registrar Approval";
    if (r.formSubmitted) return "Pending Accounts (Admin) Approval";
    return "Form Pending";
  };

  const getFieldValue = (r, key) => {
    switch (key) {
      case "name": return r.name || "";
      case "services": return r.services || r.component || "";
      case "category": return r.category || "";
      case "amount": return Number(r.amount) || 0;
      case "amountAfterTds": return r.amountAfterTds ? Number(r.amountAfterTds) : ((r.category === "Refund" || r.category === "TA/DA" || r.category === "Fellowship") ? Number(r.amount) || 0 : Number(r.amount * 0.9) || 0);
      case "dateOfEntry": return new Date(r.dateOfEntry || r.createdAt).getTime();
      case "dateOfUpload": return r.dateOfUpload ? new Date(r.dateOfUpload).getTime() : 0;
      case "dateOfForwarding": return r.dateOfForwarding || r.adminApprovedAt ? new Date(r.dateOfForwarding || r.adminApprovedAt).getTime() : 0;
      case "dateOfApproval": return r.dateOfApproval || r.registrarApprovedAt ? new Date(r.dateOfApproval || r.registrarApprovedAt).getTime() : 0;
      case "dateOfTransfer": return r.dateOfTransfer ? new Date(r.dateOfTransfer).getTime() : 0;
      case "status": return getRecordStatus(r);
      case "utrn": return r.utr_rrn_reference_number || r.utrRrnReferenceNumber || "";
      case "bankReferenceNo": return r.bankReferenceNo || "";
      default: return "";
    }
  };

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aVal = getFieldValue(a, sortConfig.key);
      const bVal = getFieldValue(b, sortConfig.key);
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [records, sortConfig]);

  const renderSortableHeader = (label, key, isRight = false) => {
    const isSorted = sortConfig.key === key;
    return (
      <th
        onClick={() => handleSort(key)}
        className={`px-0.5 py-1 border border-gray-300 text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer select-none ${isRight ? "text-right" : ""}`}
      >
        <div className={`flex items-center gap-1 ${isRight ? "justify-end" : ""}`}>
          {label}
          {isSorted ? (sortConfig.direction === "asc" ? " ↑" : " ↓") : " ↕"}
        </div>
      </th>
    );
  };

  return (
    <div className="flex flex-col min-h-screen font-sans" style={{ background: "#FAF9F6" }}>
      {/* ── Topbar ── */}
      <header
        className="w-full flex-shrink-0 flex flex-row items-center gap-4 px-6 py-3 overflow-x-auto shadow-sm"
        style={{ background: DB, color: "#fff" }}
      >
        {/* Brand */}
        <div className="flex flex-col gap-0.5 px-2 border-r border-white/15 shrink-0 mr-4 pr-6">
          <span className="text-xl font-bold tracking-wide text-white" style={{ fontFamily: "Tahoma, Geneva, sans-serif" }}>AFMS</span>
          <span className="text-[10px] text-white/50 font-bold">Accounts (Admin) Panel</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-row items-center gap-2 shrink-0 flex-1">
          <button
            className={navItemClasses(view === "upload")}
            onClick={() => setView("upload")}
          >
            Upload Entry
          </button>
          
          <div className="w-px h-6 bg-white/15 mx-2"></div>

          <button
            className={navItemClasses(view === "all")}
            onClick={() => setView("all")}
          >
            Financial Records
          </button>
          {PAYMENT_TYPES.map((cat) => (
            <button
              key={cat.key}
              className={navItemClasses(view === cat.key)}
              onClick={() => setView(cat.key)}
            >
              {cat.key}
            </button>
          ))}
        </nav>

        {/* Sign-out */}
        <div className="flex flex-row items-center gap-4 border-l border-white/15 pl-6 shrink-0">
          <span className="text-[10px] text-white/40 hidden md:block">
            Signed in as <span className="text-white/80 font-bold">Accounts (Admin)</span>
          </span>
          <button
            onClick={handleResetPassword}
            className="text-xs font-medium text-white/60 px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/10 hover:text-white transition-colors"
          >
            Reset Password
          </button>
          <button
            onClick={handleLogout}
            className="text-xs font-medium text-white/60 px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/10 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col w-full">
        {/* ── Top Header Image ── */}
        <div className="bg-white border-b w-full shrink-0 flex justify-center shadow-sm" style={{ borderColor: "#dde3ec" }}>
          <img src={headerImg} alt="AFMS Header" className="w-full max-h-24 object-contain py-2" />
        </div>
        <main className="flex-1 p-6 mx-auto w-full max-w-7xl">

        {view === "upload" ? (
          /* ── Upload Entry view ── */
          <section>
            <header className="mb-8">
              <h1 className="font-serif text-2xl font-bold mb-1.5" style={{ color: DB }}>
                Upload Entry
              </h1>
              
            </header>

            {/* Uploader Section */}
            <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-5" style={{ borderColor: "#dde3ec" }}>
              <div>
                <p className="text-sm font-semibold mb-1">Add a Single Entry Manually</p>
                <p className="text-xs text-gray-500 mb-3">Choose a form format to add the record details directly.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  <button
                    onClick={() => openAddModal("standard")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> Standard Payment Form
                  </button>
                  <button
                    onClick={() => openAddModal("salary")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> Salary Form
                  </button>
                  <button
                    onClick={() => openAddModal("refund")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> Refund Form
                  </button>
                  <button
                    onClick={() => openAddModal("fellowship")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> Fellowship Form
                  </button>
                  <button
                    onClick={() => openAddModal("tada")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> TA/DA Bill Form
                  </button>
                  <button
                    onClick={() => openAddModal("honorarium")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> Honorarium Form
                  </button>
                </div>
              </div>

              <hr className="border-gray-200" />

              <div>
                <h2 className="text-lg font-bold mb-2">Upload CSV Data</h2>
                <p className="text-sm text-gray-500 mb-4">Drag and drop your spreadsheet here or click to browse.</p>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                    dragActive ? "border-black bg-gray-50" : "border-gray-300 bg-gray-50/50 hover:bg-gray-50"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={(e) => handleFileChosen(e.target.files?.[0])} />
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold mb-1">{file ? file.name : "Select a CSV file"}</p>
                  <p className="text-xs text-gray-500">Must follow the FMS schema · .csv files only</p>
                </div>
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full text-white text-sm font-bold py-3 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: DB }}
              >
                {uploading ? "Uploading…" : "Process & Import"}
              </button>

              {uploadError && <p className="text-xs text-red-600 text-center bg-red-50 p-2 rounded border border-red-200">{uploadError}</p>}
              {uploadResult && (
                <div className="text-xs text-green-700 bg-green-50 p-3 rounded border border-green-200">
                  <p className="font-bold mb-1">Import Successful</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Added: {uploadResult.processed ?? uploadResult.insertedCount ?? uploadResult.success ?? 0}</li>
                    <li>Duplicates skipped: {uploadResult.duplicatesSkipped || 0}</li>
                  </ul>
                </div>
              )}
            </div>
          </section>

        ) : (
          /* ── Transaction records view ── */
          <section className="w-full">
            <header className="mb-4">
              <h1 className="font-serif text-2xl font-bold flex items-center gap-2.5 mb-1.5" style={{ color: DB }}>
                {view === "all" ? "Financial Records" : view}
              </h1>
              <p className="text-sm" style={{ color: "#667" }}>
                {records.length} transaction{records.length === 1 ? "" : "s"}
              </p>
            </header>

            {recordsLoading && (
              <p className="text-sm" style={{ color: "#8899aa" }}>Loading transactions…</p>
            )}
            {recordsError && (
              <p className="text-sm border rounded-lg px-4 py-3 bg-white" style={{ color: "#556", borderColor: "#d0d0d0" }}>
                {recordsError}
              </p>
            )}
            {!recordsLoading && !recordsError && records.length === 0 && (
              <p className="text-sm" style={{ color: "#8899aa" }}>
                No transactions here yet. Upload a CSV to populate this category.
              </p>
            )}

            {!recordsLoading && !recordsError && records.length > 0 && (
                <div className="w-full bg-white border border-gray-300 overflow-x-hidden">
                  <table className="w-full border-collapse text-left" style={{ fontSize: "13px" }}>
                    <thead>
                      <tr>
                        {renderSortableHeader("Payee", "name")}
                        {renderSortableHeader("Comp", "services")}
                        {renderSortableHeader("Category", "category")}
                        {renderSortableHeader("Amount", "amount", true)}
                        {renderSortableHeader("After TDS", "amountAfterTds", true)}
                        {renderSortableHeader("Uploaded", "dateOfUpload")}
                        {renderSortableHeader("Forwarded", "dateOfForwarding")}
                        {renderSortableHeader("Approved", "dateOfApproval")}
                        {renderSortableHeader("UTRN", "utrn")}
                        {renderSortableHeader("Bank Ref.", "bankReferenceNo")}
                        {renderSortableHeader("Status", "status")}
                        <th className="px-0.5 py-1 border border-gray-300 text-[11px] font-bold text-gray-700 bg-gray-100">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRecords.map((r) => {
                        const status = getRecordStatus(r);
                        
                        return (
                        <tr
                          key={r._id || r.email}
                          className="hover:bg-gray-50 transition-colors border-b border-gray-300"
                        >
                          <td className="px-0.5 py-1 border-r border-gray-300 font-medium text-gray-800">{r.name}</td>
                          <td className="px-0.5 py-1 border-r border-gray-300 text-gray-600">{r.services}</td>
                          <td className="px-0.5 py-1 border-r border-gray-300 text-gray-600">{r.category}</td>
                          <td className="px-0.5 py-1 border-r border-gray-300 text-right font-mono text-gray-700">
                            {Number(r.amount).toLocaleString("en-IN")}
                          </td>
                          <td className="px-0.5 py-1 border-r border-gray-300 text-right font-mono text-gray-700">
                            {r.amountAfterTds ? Number(r.amountAfterTds).toLocaleString("en-IN") : (r.category === "Refund" || r.category === "TA/DA" || r.category === "Fellowship" ? Number(r.amount).toLocaleString("en-IN") : Number(r.amount * 0.9).toLocaleString("en-IN"))}
                          </td>
                          <td className="px-0.5 py-1 border-r border-gray-300 text-gray-600 whitespace-nowrap">{fmtDate(r.dateOfUpload || r.dateOfEntry || r.createdAt)}</td>
                          <td className="px-0.5 py-1 border-r border-gray-300 text-gray-600 whitespace-nowrap">{fmtDate(r.dateOfForwarding || r.adminApprovedAt)}</td>
                          <td className="px-0.5 py-1 border-r border-gray-300 text-gray-600 whitespace-nowrap">{fmtDate(r.dateOfApproval || r.registrarApprovedAt)}</td>
          
                          <td className="px-0.5 py-1 border-r border-gray-300 text-gray-500 font-mono text-[11px]">{r.utr_rrn_reference_number || r.utrRrnReferenceNumber || "—"}</td>
                          <td className="px-0.5 py-1 border-r border-gray-300 text-gray-500 font-mono text-[11px]">{r.bankReferenceNo || "—"}</td>
                          <td className="px-0.5 py-1 border-r border-gray-300">
                            <span
                              className="inline-block text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                              style={
                                status === "Paid"
                                  ? { background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" }
                                  : status === "Rejected"
                                  ? { background: "#fef2f2", color: "#dc2626", borderColor: "#fca5a5" }
                                  : status === "Approved by Registrar, Pending for Payment" || status === "Pending Accounts (Admin) Approval"
                                  ? { background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }
                                  : status === "Pending Registrar Approval"
                                  ? { background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }
                                  : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
                              }
                            >
                              {status}
  {status === "Paid" && r.dateOfTransfer && (
    <div className="text-[9px] font-normal normal-case tracking-normal mt-0.5 opacity-80">{fmtDate(r.dateOfTransfer)}</div>
  )}
  {status === "Rejected" && r.rejectedAt && (
    <div className="text-[9px] font-normal normal-case tracking-normal mt-0.5 opacity-80">{fmtDate(r.rejectedAt)}</div>
  )}
  {status === "Approved by Registrar, Pending for Payment" && (r.registrarApprovedAt || r.dateOfApproval) && (
    <div className="text-[9px] font-normal normal-case tracking-normal mt-0.5 opacity-80">{fmtDate(r.registrarApprovedAt || r.dateOfApproval)}</div>
  )}
  {status === "Pending Registrar Approval" && (r.adminApprovedAt || r.dateOfForwarding) && (
    <div className="text-[9px] font-normal normal-case tracking-normal mt-0.5 opacity-80">{fmtDate(r.adminApprovedAt || r.dateOfForwarding)}</div>
  )}
  {status === "Pending Accounts (Admin) Approval" && r.dateOfUpload && (
    <div className="text-[9px] font-normal normal-case tracking-normal mt-0.5 opacity-80">{fmtDate(r.dateOfUpload)}</div>
  )}
</span>
                          </td>
                          <td className="px-0.5 py-1">
                            <div className="flex items-center gap-0.5 flex-wrap">
                              <button
                                onClick={() => setPreviewRecord(r)}
                                className="text-[11px] font-bold uppercase tracking-wider text-black border border-gray-300 hover:bg-gray-100 px-1.5 py-0.5 rounded transition-colors shadow-sm bg-white"
                              >
                                Preview
                              </button>
                               {!r.paymentProcessed && !r.registrarApproved && !r.adminApproved && (
                               <button
                               onClick={() => openRecordModal(r)}
                               className="text-[11px] font-bold uppercase tracking-wider text-black border border-gray-300 hover:bg-gray-100 px-1.5 py-0.5 rounded transition-colors shadow-sm bg-white"
                                 >
                                Edit
                               </button>
                                )} 
                              
                              {status === "Pending Accounts (Admin) Approval" && (
                                <>
                                  <button
                                    onClick={() => openAdminApproveModal(r)}
                                    className="text-[11px] font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 px-1.5 py-0.5 rounded transition-colors shadow-sm"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleAdminReject(r._id)}
                                    className="text-[11px] font-bold uppercase tracking-wider text-red-600 px-1.5 py-0.5 rounded border border-red-300 transition-colors hover:bg-red-50 bg-white shadow-sm"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {status === "Rejected" && (
                                <span className="text-[11px] font-semibold text-red-600 block mt-1">
                                  (See Preview for rejection reason)
                                </span>
                              )}
                              {status === "Pending Registrar Approval" && (
                                <span className="text-[11px] text-gray-400 italic">Awaiting Registrar</span>
                              )}
                              {status === "Approved by Registrar, Pending for Payment" && (
                                <>
                                  <button
                                    onClick={() => openProcessModal(r)}
                                    className="text-[11px] font-bold uppercase tracking-wider text-white bg-green-600 hover:bg-green-700 px-1.5 py-0.5 rounded transition-colors shadow-sm"
                                  >
                                    Process
                                  </button>
                                  <button
                                    onClick={() => handleAdminReject(r._id)}
                                    className="text-[11px] font-bold uppercase tracking-wider text-red-600 px-1.5 py-0.5 rounded border border-red-300 transition-colors hover:bg-red-50 bg-white shadow-sm"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {status === "Paid" && (
                                <button
                                  onClick={() => window.open(`/receipt/${r.token}`, '_blank')}
                                  className="text-[11px] font-bold uppercase tracking-wider text-white bg-black hover:bg-gray-800 px-1.5 py-0.5 rounded transition-colors shadow-sm"
                                >
                                  Receipt
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
            )}
          </section>
        )}
        </main>
      </div>

      {/* Generic Modal for Add/Edit/Preview */}
      {showRecordModal && (
        <RecordModal 
          record={activeRecord} 
          defaultFormType={initialFormType}
          onClose={() => setShowRecordModal(false)}
          onSave={handleSaveRecord}
        />
      )}

      {previewRecord && (
        <PreviewModal
          record={previewRecord}
          onClose={() => setPreviewRecord(null)}
        />
      )}

      {/* ── Process Payment Modal ── */}
      {processModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setProcessModal(null); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            style={{ border: "1px solid #e5e7eb" }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-black" style={{ fontFamily: "Tahoma, Geneva, sans-serif" }}>
                  Process Payment
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Enter the bank transfer details to complete processing.</p>
              </div>
              <button
                onClick={() => setProcessModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none mt-0.5"
              >
                &times;
              </button>
            </div>

            {/* UTRN info banner */}
              <div className="mx-6 mt-4 px-4 py-3 rounded-lg flex items-center gap-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">UTRN (Status Reference Only — not used as Bank Ref)</p>
                <p className="text-xs font-mono font-semibold text-gray-700 mt-0.5">{processModal.utrn}</p>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="processBankRef">
                  Bank Reference No <span className="text-red-500">*</span>
                </label>
                <input
                  id="processBankRef"
                  type="text"
                  value={processBankRef}
                  onChange={(e) => { setProcessBankRef(e.target.value); setProcessError(""); }}
                  placeholder="e.g. SBIN0000123456789"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all"
                  style={{ borderColor: processBankRef.trim() === "" && processError ? "#ef4444" : "#d1d5db" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#000")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = processBankRef.trim() === "" && processError ? "#ef4444" : "#d1d5db")}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="processDate">
                  Date of Transfer <span className="text-red-500">*</span>
                </label>
                <input
                  id="processDate"
                  type="date"
                  value={processDate}
                  onChange={(e) => { setProcessDate(e.target.value); setProcessError(""); }}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all"
                  style={{ borderColor: !processDate && processError ? "#ef4444" : "#d1d5db" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#000")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = !processDate && processError ? "#ef4444" : "#d1d5db")}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>

              {processError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {processError}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setProcessModal(null)}
                className="text-sm font-medium text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                disabled={processSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleProcessSubmit}
                disabled={processSubmitting}
                className="text-sm font-bold text-white px-5 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "black" }}
                onMouseEnter={(e) => { if (!processSubmitting) e.currentTarget.style.background = "#333"; }}
                onMouseLeave={(e) => { if (!processSubmitting) e.currentTarget.style.background = "black"; }}
              >
                {processSubmitting ? "Processing…" : "Confirm & Process"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setRejectModal(null); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" style={{ border: "1px solid #e5e7eb" }}>
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-red-600" style={{ fontFamily: "Tahoma, Geneva, sans-serif" }}>
                  Reject Application
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">A rejection email with this reason will be sent to the payee.</p>
              </div>
              <button
                onClick={() => setRejectModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none mt-0.5"
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-5">
              <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="rejectReason">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectReason"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter the reason for rejection…"
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all resize-none"
                style={{ borderColor: "#d1d5db" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#000")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                autoFocus
              />
            </div>
            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="text-sm font-medium text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                disabled={rejectSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                disabled={rejectSubmitting || !rejectReason.trim()}
                className="text-sm font-bold text-white px-5 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700"
              >
                {rejectSubmitting ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Admin Approve Confirmation Modal ── */}
      {adminApproveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setAdminApproveModal(null); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" style={{ border: "1px solid #e5e7eb" }}>
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-black" style={{ fontFamily: "Tahoma, Geneva, sans-serif" }}>
                  Confirm Approval
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">This will forward the record to the Registrar for final approval.</p>
              </div>
              <button
                onClick={() => setAdminApproveModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none mt-0.5"
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700">
                Are you sure you want to approve UTRN{" "}
                <span className="font-bold font-mono text-black">{adminApproveModal.utrn}</span>?
              </p>
              <p className="text-xs text-gray-400 mt-2">This action will mark the record as Admin-approved and forward it to the Registrar.</p>
            </div>
            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setAdminApproveModal(null)}
                className="text-sm font-medium text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                disabled={adminApproveSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={submitAdminApprove}
                disabled={adminApproveSubmitting}
                className="text-sm font-bold text-white px-5 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#2563eb" }}
                onMouseEnter={(e) => { if (!adminApproveSubmitting) e.currentTarget.style.background = "#1d4ed8"; }}
                onMouseLeave={(e) => { if (!adminApproveSubmitting) e.currentTarget.style.background = "#2563eb"; }}
              >
                {adminApproveSubmitting ? "Approving…" : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

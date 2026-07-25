import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logomain.avif";
import asssrLogo from "../assets/asssrFav.avif";
import headerImg from "../assets/header.png";
import RecordModal from "../components/RecordModal";

// Point this at your Express backend. In Vite, set VITE_API_BASE in your .env file.
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

const PAYMENT_TYPES = [
  { key: "Honorarium" },
  { key: "Salary" },
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
      const res = await fetch(`${API_BASE}/api/records/${id}/admin-approve`, { method: "PUT" });
      if (!res.ok) throw new Error("Approval failed");
      setRecords((prev) => prev.map((r) => r._id === id ? { ...r, adminApproved: true, adminApprovedAt: new Date() } : r));
    } catch (err) {
      alert(err.message);
    }
  }

  // Req 17: Process now requires bankReferenceNo and dateOfTransfer
  async function handleProcess(id) {
    setProcessRecordId(id);
    setProcessBankRef("");
    setProcessDateOfTransfer("");
    setProcessError("");
    setShowProcessModal(true);
  }

  async function submitProcess() {
    if (!processBankRef.trim()) {
      setProcessError("Bank Reference No. is required.");
      return;
    }
    if (!processDateOfTransfer) {
      setProcessError("Date of Transfer is required.");
      return;
    }
    setProcessError("");
    try {
      const res = await fetch(`${API_BASE}/api/records/${processRecordId}/process`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankReferenceNo: processBankRef.trim(),
          dateOfTransfer: processDateOfTransfer,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Processing failed");
      setRecords((prev) => prev.map((r) => r._id === processRecordId ? {
        ...r,
        paymentProcessed: true,
        paymentProcessedAt: new Date(),
        bankReferenceNo: processBankRef.trim(),
        dateOfTransfer: processDateOfTransfer,
        receiptNumber: data.receiptNumber || r.receiptNumber,
      } : r));
      setShowProcessModal(false);
    } catch (err) {
      setProcessError(err.message);
    }
  }

  function copyLink(token) {
    const link = `${window.location.origin}/form/${token}`;
    navigator.clipboard.writeText(link);
    alert("Link copied!");
  }

  // Generic Add/Edit
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);

  function openAddModal() {
    setActiveRecord(null);
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
      headers: { "Content-Type": "application/json" },
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

  // Process modal state (Req 17)
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processRecordId, setProcessRecordId] = useState(null);
  const [processBankRef, setProcessBankRef] = useState("");
  const [processDateOfTransfer, setProcessDateOfTransfer] = useState("");
  const [processError, setProcessError] = useState("");



  const fetchRecords = useCallback(async () => {
    if (view === "upload") return;
    setRecordsLoading(true);
    setRecordsError(null);
    try {
      const query = view === "all" ? "" : `?category=${encodeURIComponent(view)}`;
      const res = await fetch(`${API_BASE}/api/records${query}`);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : data.records || []);
    } catch (err) {
      setRecordsError(err.message || "Couldn't load records.");
    } finally {
      setRecordsLoading(false);
    }
  }, [view]);

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

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : "-";

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
          <span className="text-[10px] text-white/50">Admin Panel</span>
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
            Signed in as <span className="text-white/80">{auth?.username}</span>
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
              <p className="text-sm" style={{ fontFamily: "Tahoma, Geneva, sans-serif", color: "#556" }}>
                <a href="/sample.csv" download="sample.csv" className="font-semibold underline underline-offset-2 cursor-pointer" style={{ color: DB }}>
                  Download Sample CSV Template
                </a>
              </p>
            </header>

            {/* Uploader Section */}
            <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col gap-5" style={{ borderColor: "#dde3ec" }}>
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

              <hr className="border-gray-200" />

              <div>
                <p className="text-sm font-semibold mb-1">Add a Single Entry Manually</p>
                <p className="text-xs text-gray-500 mb-3">Fill in the record details without uploading a CSV file.</p>
                <button
                  onClick={openAddModal}
                  className="w-full text-sm font-bold py-3 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700"
                >
                  + Add Single Entry
                </button>
              </div>
            </div>
          </section>

        ) : (
          /* ── Transaction records view ── */
          <section>
            <header className="mb-8">
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
                <div className="w-full overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
                  <table className="w-full border-collapse text-sm text-left whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {["Name", "UTRN", "Amount", "After TDS", "Action"].map((h) => (
                          <th
                            key={h}
                            className={`text-[11px] font-bold uppercase tracking-wider text-gray-500 py-3 px-4 ${
                              (h === "Amount" || h === "After TDS") ? "text-right" : ""
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {records.map((r) => {
                        let status = "Form Pending";
                        if (r.formSubmitted) status = "Needs Admin Approval";
                        if (r.adminApproved) status = "Needs Registrar Approval";
                        if (r.registrarApproved) status = "Ready for Payment";
                        if (r.paymentProcessed) status = "Paid";
                        
                        return (
                        <tr
                          key={r._id || r.email}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-2 px-4 font-medium text-gray-800">{r.name}</td>
                          <td className="py-2 px-4 text-gray-500 font-mono text-xs">{r.receiptNumber || r.token?.split("-")[0].toUpperCase() || "—"}</td>
                          <td className="py-2 px-4 text-right font-mono text-gray-700">
                            {Number(r.amount).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2 px-4 text-right font-mono text-gray-700">
                            {r.amountAfterTds ? Number(r.amountAfterTds).toLocaleString("en-IN") : (r.category === "Refund" || r.category === "TA/DA" ? Number(r.amount).toLocaleString("en-IN") : Number(r.amount * 0.9).toLocaleString("en-IN"))}
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border"
                                style={
                                  status === "Paid"
                                    ? { background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" }
                                    : status === "Ready for Payment" || status === "Needs Admin Approval"
                                    ? { background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }
                                    : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
                                }
                              >
                                {status}
                              </span>
                              <button
                                onClick={() => openRecordModal(r)}
                                className="text-[10px] font-bold uppercase tracking-wider text-black border border-gray-300 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                              >
                                Preview / Edit
                              </button>
                              {status === "Form Pending" && (
                                <button
                                  onClick={() => copyLink(r.token)}
                                  className="text-[10px] font-bold uppercase tracking-wider text-black bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-md transition-colors"
                                >
                                  Copy Link
                                </button>
                              )}
                              {status === "Needs Admin Approval" && (
                                <button
                                  onClick={() => handleAdminApprove(r._id)}
                                  className="text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                >
                                  Approve
                                </button>
                              )}
                              {status === "Ready for Payment" && (
                                <button
                                  onClick={() => handleProcess(r._id)}
                                  className="text-[10px] font-bold uppercase tracking-wider text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                >
                                  Process
                                </button>
                              )}
                              {status === "Paid" && (
                                <button
                                  onClick={() => window.open(`/receipt/${r.token}`, '_blank')}
                                  className="text-[10px] font-bold uppercase tracking-wider text-white bg-black hover:bg-gray-800 px-3 py-1.5 rounded-md transition-colors shadow-sm"
                                >
                                  Receipt
                                </button>
                              )}

                              {/* Req 16: Delete button removed from Admin — only Registrar can delete */}
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
          onClose={() => setShowRecordModal(false)}
          onSave={handleSaveRecord}
        />
      )}

      {/* ── Process Payment Modal (Req 17) ── */}
      {showProcessModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowProcessModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">Process Payment</h2>
              <p className="text-sm text-gray-500 mb-4">Enter the bank transfer details to generate the receipt.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Bank Reference No. *</label>
                  <input
                    type="text"
                    value={processBankRef}
                    onChange={(e) => setProcessBankRef(e.target.value)}
                    placeholder="e.g. UTIB20260001234"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Date of Transfer *</label>
                  <input
                    type="date"
                    value={processDateOfTransfer}
                    onChange={(e) => setProcessDateOfTransfer(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {processError && (
                <p className="text-sm text-red-600 mt-3">{processError}</p>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitProcess}
                  className="text-sm font-semibold px-5 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Process & Generate Receipt
                </button>
              </div>
            </div>
          </div>
        </>
      )}



    </div>
  );
}
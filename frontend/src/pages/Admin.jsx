import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logomain.avif";
import asssrLogo from "../assets/asssr.avif";

// Point this at your Express backend. In Vite, set VITE_API_BASE in your .env file.
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

const CATEGORIES = [
  { key: "Salary" },
  { key: "Fellowship" },
  { key: "Honorarium" },
  { key: "Refund" },
  { key: "TA/DA" },
];

// Dark blue palette
const DB = "#1b3358";          // dark blue
const DB_HOVER = "#152849";    // darker on hover
const DB_ACTIVE = "#243f6b";   // lighter blue for active nav item

export default function AdminDashboard() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function handleProcess(id) {
    try {
      const res = await fetch(`${API_BASE}/api/records/${id}/process`, { method: "PUT" });
      if (!res.ok) throw new Error("Processing failed");
      setRecords((prev) => prev.map((r) => r._id === id ? { ...r, paymentProcessed: true } : r));
    } catch (err) {
      alert(err.message);
    }
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
    `w-full flex items-center gap-2.5 text-left bg-transparent border-none text-sm px-3 py-2 rounded-md cursor-pointer whitespace-nowrap shrink-0 transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50 focus-visible:outline-offset-2 ${
      active
        ? "bg-white/15 text-white font-semibold"
        : "text-white/65 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="flex flex-col md:flex-row min-h-screen font-sans" style={{ background: "#f4f2ed" }}>

      {/* ── Sidebar ── */}
      <aside
        className="w-full md:w-56 flex-shrink-0 flex flex-row md:flex-col gap-4 md:gap-6 p-4 md:p-6 overflow-x-auto md:overflow-visible"
        style={{ background: DB, color: "#fff" }}
      >
        {/* Brand */}
        <div className="flex flex-col gap-0.5 px-1 md:pb-5 border-b-0 md:border-b border-white/15 shrink-0">
          <div className="flex gap-2 mb-2">
            <div className="w-12 h-12 flex items-center justify-center">
              <img src={logo} alt="AFMS Logo" className="w-full h-full object-contain" />
            </div>
            <div className="w-12 h-12 flex items-center justify-center">
              <img src={asssrLogo} alt="ASSSR Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <span className="text-2xl font-bold tracking-wide text-white" style={{ fontFamily: "Tahoma, Geneva, sans-serif" }}>AFMS</span>
          <span className="text-[11px] text-white/50">Finance Department</span>
        </div>

        {/* New Entry nav */}
        <nav className="flex flex-row md:flex-col gap-0.5 shrink-0">
          <span className="hidden md:block text-[10px] uppercase tracking-widest text-white/35 px-3 pb-1.5 pt-1">
            New Entry
          </span>
          <button
            className={navItemClasses(view === "upload")}
            onClick={() => setView("upload")}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-current opacity-60" />
            Upload Entry
          </button>
        </nav>

        {/* Transaction nav */}
        <nav className="flex flex-row md:flex-col gap-0.5 shrink-0">
          <span className="hidden md:block text-[10px] uppercase tracking-widest text-white/35 px-3 pb-1.5 pt-1">
            Transaction
          </span>
          <button
            className={navItemClasses(view === "all")}
            onClick={() => setView("all")}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-current opacity-60" />
            Financial Records
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={navItemClasses(view === cat.key)}
              onClick={() => setView(cat.key)}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-current opacity-60" />
              {cat.key}
            </button>
          ))}
        </nav>

        {/* Sign-out — pinned to bottom on desktop, inline on mobile */}
        <div className="hidden md:flex flex-col mt-auto pt-4 border-t border-white/15 shrink-0">
          <span className="text-[10px] text-white/40 mb-2 px-1">
            Signed in as <span className="text-white/80">{auth?.username}</span>
          </span>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs font-medium text-white/60 px-3 py-2 rounded-lg border border-white/15 hover:bg-white/10 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="md:hidden text-xs font-medium text-white/60 border border-white/15 rounded-lg px-3 py-1.5 shrink-0 hover:bg-white/10 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 p-6 md:p-10 md:px-12 max-w-[980px]">

        {view === "upload" ? (
          /* ── Upload Entry view ── */
          <section>
            <header className="mb-8">
              <h1 className="font-serif text-2xl font-bold mb-1.5" style={{ color: DB }}>
                Upload Entry
              </h1>
              <p className="text-sm" style={{ fontFamily: "Tahoma, Geneva, sans-serif", color: "#556" }}>
                Use the{" "}
                <a href="/sample.csv" download="sample.csv" className="font-semibold underline underline-offset-2 cursor-pointer" style={{ color: DB }}>
                  sample CSV template
                </a>
                {" "}— columns: name, email, amount, category, services.
              </p>
            </header>

            {/* Drop zone */}
            <div
              className={`border border-dashed rounded-xl bg-white px-6 py-12 text-center cursor-pointer mb-5 transition-colors motion-reduce:transition-none`}
              style={
                dragActive
                  ? { borderColor: DB, background: "#eaf0f8" }
                  : undefined
              }
              onMouseEnter={(e) => { if (!dragActive) e.currentTarget.style.borderColor = DB; }}
              onMouseLeave={(e) => { if (!dragActive) e.currentTarget.style.borderColor = "#d0d0d0"; }}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                hidden
                onChange={(e) => handleFileChosen(e.target.files?.[0])}
              />
              {file ? (
                <p className="font-mono text-sm" style={{ color: DB }}>{file.name}</p>
              ) : (
                <>
                  <p className="text-[15px] font-semibold mb-1" style={{ color: DB }}>Drop a CSV file here</p>
                  <p className="text-[13px]" style={{ fontFamily: "Tahoma, Geneva, sans-serif", color: "#8899aa" }}>
                    or click to browse · .csv files only
                  </p>
                </>
              )}
            </div>

            <button
              style={{ background: file && !uploading ? DB : undefined }}
              className="text-white border-none text-sm font-semibold px-5 py-2.5 rounded-lg cursor-pointer transition-colors motion-reduce:transition-none disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              disabled={!file || uploading}
              onClick={handleUpload}
              onMouseEnter={(e) => { if (file && !uploading) e.currentTarget.style.background = DB_HOVER; }}
              onMouseLeave={(e) => { if (file && !uploading) e.currentTarget.style.background = DB; }}
            >
              {uploading ? "Uploading…" : "Upload Entry"}
            </button>

            {uploadError && (
              <p className="text-sm mt-3.5 border rounded-lg px-4 py-3 bg-white" style={{ color: "#556", borderColor: "#d0d0d0" }}>
                {uploadError}
              </p>
            )}

            {uploadResult && (
              <div className="mt-4 px-4 py-4 bg-white border rounded-lg" style={{ borderColor: "#dde3ec" }}>
                <p className="text-sm font-medium" style={{ color: DB }}>
                  {uploadResult.insertedCount ?? uploadResult.success ?? 0} record(s) added.
                </p>
                {uploadResult.errors?.length > 0 && (
                  <ul className="mt-2.5 pl-4 text-[13px] text-[#556] list-disc">
                    {uploadResult.errors.map((e, i) => (
                      <li key={i}>Row {e.row}: {e.reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
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
              <div className="rounded-lg border overflow-hidden bg-white" style={{ borderColor: "#dde3ec" }}>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      {["Name", "Email", "Amount", "After TDS", "Payment Type", "Component", "Status", "Action"].map((h) => (
                        <th
                          key={h}
                          className={`text-[10px] uppercase tracking-widest px-4 py-3 border-b font-semibold ${
                            (h === "Amount" || h === "After TDS") ? "text-right" : "text-left"
                          }`}
                          style={{ color: "#7a8baa", borderColor: "#dde3ec", background: "#f5f7fb" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => {
                      let status = "Form Pending";
                      if (r.formSubmitted) status = "Needs Approval";
                      if (r.registrarApproved) status = "Ready for Payment";
                      if (r.paymentProcessed) status = "Paid";
                      
                      return (
                      <tr
                        key={r._id || r.email}
                        className="transition-colors"
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f7fb")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <td className="px-4 py-3 border-b font-medium" style={{ borderColor: "#edf0f7", color: DB }}>{r.name}</td>
                        <td className="px-4 py-3 border-b" style={{ borderColor: "#edf0f7", color: "#556" }}>{r.email}</td>
                        <td className="px-4 py-3 border-b text-right font-mono tabular-nums font-semibold" style={{ borderColor: "#edf0f7", color: DB }}>
                          {Number(r.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 border-b text-right font-mono tabular-nums font-semibold" style={{ borderColor: "#edf0f7", color: DB }}>
                          {r.amountAfterTds ? Number(r.amountAfterTds).toLocaleString() : Number(r.amount * 0.9).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 border-b" style={{ borderColor: "#edf0f7", color: "#556" }}>{r.category}</td>
                        <td className="px-4 py-3 border-b" style={{ borderColor: "#edf0f7", color: "#556" }}>{r.services}</td>
                        <td className="px-4 py-3 border-b" style={{ borderColor: "#edf0f7" }}>
                          <span
                            className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                            style={
                              status === "Paid"
                                ? { background: "#e6f4ea", color: "#137333", borderColor: "#ceead6" }
                                : status === "Ready for Payment"
                                ? { background: "#e8eef7", color: DB, borderColor: "#c5d0e8" }
                                : { background: "#fff", color: "#99a", borderColor: "#e0e4ee" }
                            }
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 border-b" style={{ borderColor: "#edf0f7" }}>
                          {status === "Ready for Payment" && (
                            <button
                              onClick={() => handleProcess(r._id)}
                              className="text-[10px] font-bold uppercase tracking-wider text-white px-3 py-1.5 rounded-md transition-colors"
                              style={{ background: DB }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#152849")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = DB)}
                            >
                              Process
                            </button>
                          )}
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
  );
}
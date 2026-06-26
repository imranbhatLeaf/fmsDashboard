import { useState, useRef, useEffect, useCallback } from "react";

// Point this at your Express backend. In Vite, set VITE_API_BASE in your .env file.
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

const CATEGORIES = [
  { key: "Honorarium", color: "#B98A2E" },
  { key: "Salary", color: "#3E7C74" },
  { key: "Fellowship", color: "#8C5A3C" },
  { key: "TA/DA", color: "#5B6F8C" },
  { key: "Refund", color: "#8C4A4A" },
];

export default function AdminDashboard() {
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

  const activeCategoryMeta = CATEGORIES.find((c) => c.key === view);

  const navItemClasses = (active) =>
    `w-full flex items-center gap-2.5 text-left bg-transparent border-none text-sm px-2.5 py-2 rounded-md cursor-pointer whitespace-nowrap shrink-0 transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b98a2e] focus-visible:outline-offset-2 ${
      active
        ? "bg-[#1f3354] text-white shadow-[inset_2px_0_0_0_#b98a2e]"
        : "text-white/85 hover:bg-[#1f3354]"
    }`;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f8f6f2] text-[#1b2430] font-sans">
      <aside className="w-full md:w-60 flex-shrink-0 bg-[#15243d] text-[#e8e4dc] flex flex-row md:flex-col gap-4 md:gap-7 p-4 md:p-7 overflow-x-auto md:overflow-visible">
        <div className="flex flex-col gap-0.5 px-2 md:pb-4 border-b-0 md:border-b border-white/10 shrink-0">
          <span className="font-serif text-2xl font-semibold tracking-wide">FMS</span>
          <span className="text-xs text-white/60">Records Admin</span>
        </div>

        <nav className="flex flex-row md:flex-col gap-0.5 shrink-0">
          <span className="hidden md:block text-[11px] uppercase tracking-wider text-white/45 px-2 pb-1.5">
            Upload
          </span>
          <button
            className={navItemClasses(view === "upload")}
            onClick={() => setView("upload")}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-white/40" />
            Upload CSV
          </button>
        </nav>

        <nav className="flex flex-row md:flex-col gap-0.5 shrink-0">
          <span className="hidden md:block text-[11px] uppercase tracking-wider text-white/45 px-2 pb-1.5">
            Records
          </span>
          <button
            className={navItemClasses(view === "all")}
            onClick={() => setView("all")}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-white/40" />
            All records
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={navItemClasses(view === cat.key)}
              onClick={() => setView(cat.key)}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: cat.color }}
              />
              {cat.key}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10 md:px-12 max-w-[980px]">
        {view === "upload" ? (
          <section>
            <header className="mb-7">
              <h1 className="font-serif text-2xl font-semibold mb-1.5">
                Upload records
              </h1>
              <p className="text-sm text-[#5a6270]">
                Add a CSV with name, email, amount, category and services.
              </p>
            </header>

            <div
              className={`border border-dashed rounded-xl bg-white px-6 py-12 text-center cursor-pointer mb-5 transition-colors motion-reduce:transition-none ${
                dragActive
                  ? "border-[#b98a2e] bg-[#f1e3c6]"
                  : "border-[#e4dfd4] hover:border-[#b98a2e] hover:bg-[#f1e3c6]"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
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
                <p className="font-mono text-sm">{file.name}</p>
              ) : (
                <>
                  <p className="text-[15px] font-medium mb-1">Drop a CSV file here</p>
                  <p className="text-[13px] text-[#5a6270]">or click to browse</p>
                </>
              )}
            </div>

            <button
              className="bg-[#b98a2e] text-white border-none text-sm font-semibold px-5 py-2.5 rounded-lg cursor-pointer transition-colors motion-reduce:transition-none hover:bg-[#a37a26] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#15243d] focus-visible:outline-offset-2"
              disabled={!file || uploading}
              onClick={handleUpload}
            >
              {uploading ? "Uploading…" : "Upload CSV"}
            </button>

            {uploadError && (
              <p className="text-[#8c4a4a] text-sm mt-3.5">{uploadError}</p>
            )}

            {uploadResult && (
              <div className="mt-4.5 px-4.5 py-4 bg-white border border-[#e4dfd4] rounded-lg">
                <p className="text-[#3e7c74] text-sm font-medium">
                  {uploadResult.insertedCount ?? uploadResult.success ?? 0} record(s) added.
                </p>
                {uploadResult.errors?.length > 0 && (
                  <ul className="mt-2.5 pl-4.5 text-[13px] text-[#8c4a4a] list-disc">
                    {uploadResult.errors.map((e, i) => (
                      <li key={i}>
                        Row {e.row}: {e.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        ) : (
          <section>
            <header className="mb-7">
              <h1 className="font-serif text-2xl font-semibold flex items-center gap-2.5 mb-1.5">
                {view === "all" ? "All records" : view}
                {activeCategoryMeta && (
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: activeCategoryMeta.color }}
                  />
                )}
              </h1>
              <p className="text-sm text-[#5a6270]">
                {records.length} record{records.length === 1 ? "" : "s"}
              </p>
            </header>

            {recordsLoading && (
              <p className="text-[#5a6270] text-sm">Loading records…</p>
            )}
            {recordsError && (
              <p className="text-[#8c4a4a] text-sm">{recordsError}</p>
            )}

            {!recordsLoading && !recordsError && records.length === 0 && (
              <p className="text-[#5a6270] text-sm">
                No records here yet. Upload a CSV to populate this category.
              </p>
            )}

            {!recordsLoading && !recordsError && records.length > 0 && (
              <div className="rounded-lg border border-[#e4dfd4] overflow-hidden bg-white">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="text-left text-[11px] uppercase tracking-wide text-[#5a6270] px-4 py-3 border-b border-[#e4dfd4] bg-[#fbfaf7]">
                        Name
                      </th>
                      <th className="text-left text-[11px] uppercase tracking-wide text-[#5a6270] px-4 py-3 border-b border-[#e4dfd4] bg-[#fbfaf7]">
                        Email
                      </th>
                      <th className="text-right text-[11px] uppercase tracking-wide text-[#5a6270] px-4 py-3 border-b border-[#e4dfd4] bg-[#fbfaf7]">
                        Amount
                      </th>
                      <th className="text-left text-[11px] uppercase tracking-wide text-[#5a6270] px-4 py-3 border-b border-[#e4dfd4] bg-[#fbfaf7]">
                        Category
                      </th>
                      <th className="text-left text-[11px] uppercase tracking-wide text-[#5a6270] px-4 py-3 border-b border-[#e4dfd4] bg-[#fbfaf7]">
                        Services
                      </th>
                      <th className="text-left text-[11px] uppercase tracking-wide text-[#5a6270] px-4 py-3 border-b border-[#e4dfd4] bg-[#fbfaf7]">
                        Email status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&>tr:last-child>td]:border-b-0">
                    {records.map((r) => (
                      <tr key={r._id || r.email}>
                        <td className="px-4 py-3 border-b border-[#e4dfd4]">{r.name}</td>
                        <td className="px-4 py-3 border-b border-[#e4dfd4]">{r.email}</td>
                        <td className="px-4 py-3 border-b border-[#e4dfd4] text-right font-mono tabular-nums">
                          {Number(r.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 border-b border-[#e4dfd4]">{r.category}</td>
                        <td className="px-4 py-3 border-b border-[#e4dfd4]">{r.services}</td>
                        <td className="px-4 py-3 border-b border-[#e4dfd4]">
                          <span
                            className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${
                              r.emailSent
                                ? "bg-[#e4efed] text-[#3e7c74]"
                                : r.error
                                ? "bg-[#f2e4e4] text-[#8c4a4a]"
                                : "bg-[#f0eee8] text-[#5a6270]"
                            }`}
                          >
                            {r.emailSent ? "Sent" : r.error ? "Failed" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
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
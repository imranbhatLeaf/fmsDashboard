import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logomain.avif";
import asssrLogo from "../assets/asssrFav.avif";
import headerImg from "../assets/header.png";
import RecordModal from "../components/RecordModal";
import PreviewModal from "../components/PreviewModal";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

const COMPONENTS = ["ASSSR", "JASSSR", "DHC", "VMI"];

const DB = "black";

export default function Registrar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("all");
  const [records, setRecords]               = useState([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "dateOfEntry", direction: "desc" });
  const [summary, setSummary] = useState({ total: 0, sent: 0, pending: 0, failed: 0 });
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [recycleBinLoading, setRecycleBinLoading] = useState(false);
  const [recycleBinRecords, setRecycleBinRecords] = useState([]);
  const [previewRecord, setPreviewRecord] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = activeCategory === "all" ? "?adminApproved=true" : `?adminApproved=true&component=${encodeURIComponent(activeCategory)}`;
      const res = await fetch(`${API_BASE}/api/records${query}`, {
        headers: { Authorization: `Bearer ${auth?.token}` }
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.records || [];
      setRecords(list);
      setSummary({
        total:   list.length,
        sent:    list.filter((r) => r.emailSent).length,
        pending: list.filter((r) => !r.emailSent && !r.error).length,
        failed:  list.filter((r) => r.error).length,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, auth?.token]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Fetch recycle bin records (Req 19)
  async function fetchRecycleBin() {
    setRecycleBinLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/records/recycle-bin`, {
        headers: { Authorization: `Bearer ${auth?.token}` }
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setRecycleBinRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      alert("Failed to load recycle bin: " + err.message);
    } finally {
      setRecycleBinLoading(false);
    }
  }

  function toggleRecycleBin() {
    if (!showRecycleBin) {
      fetchRecycleBin();
    }
    setShowRecycleBin(!showRecycleBin);
  }

  // Restore a soft-deleted record (Req 19)
  async function handleRestore(id) {
    try {
      const res = await fetch(`${API_BASE}/api/records/${id}/restore`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${auth?.token}` }
      });
      if (!res.ok) throw new Error("Restore failed");
      setRecycleBinRecords((prev) => prev.filter((r) => r._id !== id));
      fetchRecords(); // refresh main list
    } catch (err) {
      alert(err.message);
    }
  }

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

  // Approve modal state
  const [approveModal, setApproveModal] = useState(null); // null | { id, name }
  const [approveSubmitting, setApproveSubmitting] = useState(false);

  function openApproveModal(record) {
    setApproveModal({ id: record._id, name: record.name });
    setApproveSubmitting(false);
  }

  async function submitApprove() {
    setApproveSubmitting(true);
    const id = approveModal.id;
    try {
      const res = await fetch(`${API_BASE}/api/records/${id}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${auth?.token}` }
      });
      if (!res.ok) throw new Error("Approval failed");
      setRecords((prev) => prev.map((r) => r._id === id ? { ...r, registrarApproved: true, dateOfApproval: new Date(), rejected: false } : r));
      setApproveModal(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setApproveSubmitting(false);
    }
  }

  // Reject modal state
  const [rejectModal, setRejectModal] = useState(null); // null | { id }
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  function openRejectModal(id) {
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

  // Req 16: Delete is limited to Registrar only (kept here)
  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this record? It will be moved to the Recycle Bin for 30 days.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/records/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth?.token}` }
      });
      if (!res.ok) throw new Error("Deletion failed");
      setRecords((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert(err.message);
    }
  }


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
    if (r.registrarApproved) return "Approved";
    if (r.adminApproved) return "Pending Registrar Approval";
    if (r.formSubmitted) return "Pending Admin Approval";
    return "Form Pending";
  };

  const getFieldValue = (r, key) => {
    switch (key) {
      case "name": return r.name || "";
      case "services": return r.services || r.component || "";
      case "category": return r.category || "";
      case "amount": return Number(r.amount) || 0;
      case "amountAfterTds": return r.amountAfterTds ? Number(r.amountAfterTds) : ((r.category === "Refund" || r.category === "Fellowship") ? Number(r.amount) || 0 : Number(r.amount * 0.9) || 0);
      case "dateOfEntry": return new Date(r.dateOfEntry || r.createdAt).getTime();
      case "dateOfUpload": return r.dateOfUpload ? new Date(r.dateOfUpload).getTime() : 0;
      case "dateOfForwarding": return r.dateOfForwarding || r.adminApprovedAt ? new Date(r.dateOfForwarding || r.adminApprovedAt).getTime() : 0;
      case "dateOfApproval": return r.dateOfApproval || r.registrarApprovedAt ? new Date(r.dateOfApproval || r.registrarApprovedAt).getTime() : 0;
      case "dateOfTransfer": return r.dateOfTransfer ? new Date(r.dateOfTransfer).getTime() : 0;
      case "status": return getRecordStatus(r);
      case "utrn": return r.utr_rrn_reference_number || r.utrRrnReferenceNumber || "";
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
        className={`px-3 py-2 border border-gray-300 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer select-none ${isRight ? "text-right" : ""}`}
      >
        <div className={`flex items-center gap-1 ${isRight ? "justify-end" : ""}`}>
          {label}
          {isSorted ? (sortConfig.direction === "asc" ? " ↑" : " ↓") : " ↕"}
        </div>
      </th>
    );
  };

  const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: "#FAF9F6", color: "black" }}>
      {/* ── Top Header Image ── */}
      <header className="bg-white border-b w-full shrink-0 flex justify-center" style={{ borderColor: "#dde3ec" }}>
        <img src={headerImg} alt="AFMS Header" className="w-full max-h-32 object-contain py-2" />
      </header>

      {/* ── Top nav ── */}
      <header className="bg-white border-b px-6 md:px-10 py-4 flex items-center justify-between" style={{ borderColor: "#dde3ec" }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src={logo} alt="AFMS Logo" className="w-full h-full object-contain" />
            </div>
            <div className="w-10 h-10 flex items-center justify-center">
              <img src={asssrLogo} alt="ASSSR Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <div>
            <span className="text-lg font-bold" style={{ color: DB, fontFamily: "Tahoma, Geneva, sans-serif" }}>AFMS</span>
            <span className="hidden md:inline text-[#ccc] mx-2">·</span>
            <span className="hidden md:inline text-xs text-[#99a] uppercase tracking-widest font-bold">Registrar View</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-xs text-[#aab]">
            Signed in as <span className="font-semibold" style={{ color: DB }}>Registrar</span>
          </span>
          <button
            onClick={handleResetPassword}
            className="text-xs font-medium border rounded-lg px-3 py-1.5 transition-colors"
            style={{ color: "#556", borderColor: "#dde3ec" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#eef1f8"; e.currentTarget.style.borderColor = "#bbc5d8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.borderColor = "#dde3ec"; }}
          >
            Reset Password
          </button>
          <button
            onClick={handleLogout}
            className="text-xs font-medium border rounded-lg px-3 py-1.5 transition-colors"
            style={{ color: "#556", borderColor: "#dde3ec" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#eef1f8"; e.currentTarget.style.borderColor = "#bbc5d8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.borderColor = "#dde3ec"; }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="px-6 md:px-10 py-4 max-w-[1600px] w-full mx-auto">

        {/* Page title */}
        <div className="mb-2">
          <h1 className="font-serif text-xl font-bold" style={{ color: DB }}>Transaction Overview</h1>
          <p className="text-xs mt-0.5" style={{ color: "#8899aa" }}>View all financial transactions and their email status.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
          {[
            { label: "Total Transactions", value: summary.total },
            { label: "Emails Sent",        value: summary.sent },
            { label: "Pending",            value: summary.pending },
            { label: "Failed",             value: summary.failed },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border px-4 py-2" style={{ borderColor: "#dde3ec" }}>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: "#99aabb" }}>{stat.label}</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: DB }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Total amount card */}
        <div className="rounded-xl px-6 py-2 mb-2 flex items-center justify-between border" style={{ background: "#FAF9F6", borderColor: "#dde3ec" }}>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">Total Amount</p>
            <p className="font-serif text-3xl font-bold tabular-nums text-black">
              ₹{totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
            </svg>
          </div>
        </div>

        {/* Category filter tabs + Recycle Bin toggle */}
        <div className="flex gap-2 flex-wrap mb-5 items-center">
          {["all", ...COMPONENTS].map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setShowRecycleBin(false); }}
              className="text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors"
              style={
                activeCategory === cat && !showRecycleBin
                  ? { background: DB, color: "#fff", borderColor: DB }
                  : { background: "#fff", color: "#556", borderColor: "#dde3ec" }
              }
              onMouseEnter={(e) => {
                if (activeCategory !== cat || showRecycleBin) {
                  e.currentTarget.style.borderColor = "#9aaac8";
                  e.currentTarget.style.color = DB;
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== cat || showRecycleBin) {
                  e.currentTarget.style.borderColor = "#dde3ec";
                  e.currentTarget.style.color = "#556";
                }
              }}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          {/* Req 19: Recycle Bin button */}
          <button
            onClick={toggleRecycleBin}
            className="text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors flex items-center gap-1.5"
            style={
              showRecycleBin
                ? { background: "#dc2626", color: "#fff", borderColor: "#dc2626" }
                : { background: "#fff", color: "#dc2626", borderColor: "#fca5a5" }
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            Recycle Bin
          </button>
        </div>

        {/* ── Recycle Bin View (Req 19) ── */}
        {showRecycleBin ? (
          <section>
            <header className="mb-1.5">
              <h2 className="font-serif text-xl font-bold flex items-center gap-2" style={{ color: "#dc2626" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                Recycle Bin
              </h2>
              <p className="text-sm mt-1" style={{ color: "#8899aa" }}>Deleted records are kept for 30 days before permanent removal.</p>
            </header>

            {recycleBinLoading && <p className="text-sm" style={{ color: "#aab" }}>Loading deleted records…</p>}
            {!recycleBinLoading && recycleBinRecords.length === 0 && (
              <p className="text-sm" style={{ color: "#aab" }}>Recycle bin is empty.</p>
            )}
            {!recycleBinLoading && recycleBinRecords.length > 0 && (
              <div className="w-full overflow-x-auto bg-white rounded-lg shadow-sm border border-red-200">
                <table className="w-full border-collapse text-sm text-left whitespace-nowrap">
                  <thead className="bg-red-50 border-b border-red-200">
                    <tr>
                      {["Name", "Category", "Amount", "Deleted On", "Days Left", "Action"].map((h) => (
                        <th key={h} className="text-[11px] font-bold uppercase tracking-wider text-red-400 py-3 px-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-50">
                    {recycleBinRecords.map((r) => {
                      const deletedDate = new Date(r.deletedAt);
                      const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)));
                      return (
                        <tr key={r._id} className="hover:bg-red-50/50 transition-colors">
                          <td className="py-2 px-4 font-medium text-gray-800">{r.name}</td>
                          <td className="py-2 px-4 text-gray-500">{r.category}</td>
                          <td className="py-2 px-4 font-mono text-gray-700">₹{Number(r.amount).toLocaleString("en-IN")}</td>
                          <td className="py-2 px-4 text-gray-500 text-xs">{fmtDate(r.deletedAt)}</td>
                          <td className="py-2 px-4">
                            <span className={`text-xs font-bold ${daysLeft <= 7 ? 'text-red-600' : 'text-orange-500'}`}>
                              {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            <button
                              onClick={() => handleRestore(r._id)}
                              className="text-[10px] font-bold uppercase tracking-wider text-green-700 px-3 py-1.5 rounded-md border border-green-200 hover:bg-green-50 transition-colors"
                            >
                              Restore
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Table */}
            {loading && <p className="text-sm" style={{ color: "#aab" }}>Loading transactions…</p>}
            {error && (
              <p className="text-sm border rounded-lg px-4 py-3 bg-white" style={{ color: "#556", borderColor: "#dde3ec" }}>{error}</p>
            )}
            {!loading && !error && records.length === 0 && (
              <p className="text-sm" style={{ color: "#aab" }}>No transactions found for this category.</p>
            )}
            {!loading && !error && records.length > 0 && (
              <div className="w-full overflow-x-auto bg-white border border-gray-300">
                <table className="w-full border-collapse text-left whitespace-nowrap" style={{ fontSize: "13px" }}>
                  <thead>
                    <tr>
                      {renderSortableHeader("Name", "name")}
                      {renderSortableHeader("Component", "services")}
                      {renderSortableHeader("Category", "category")}
                      {renderSortableHeader("Amount", "amount", true)}
                      {renderSortableHeader("After TDS", "amountAfterTds", true)}
                      {renderSortableHeader("UTRN", "utrn")}
                      {renderSortableHeader("Status", "status")}
                      <th className="px-2 py-1 border border-gray-300 text-xs font-bold text-gray-700 bg-gray-100">Actions</th>
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
                          <td className="px-2 py-1 border-r border-gray-300 font-medium text-gray-800">{r.name}</td>
                          <td className="px-2 py-1 border-r border-gray-300 text-gray-600">{r.services}</td>
                          <td className="px-2 py-1 border-r border-gray-300 text-gray-600">{r.category}</td>
                          <td className="px-2 py-1 border-r border-gray-300 text-right font-mono text-gray-700">
                            ₹{Number(r.amount).toLocaleString("en-IN")}
                          </td>
                          <td className="px-2 py-1 border-r border-gray-300 text-right font-mono text-gray-700">
                            ₹{r.amountAfterTds ? Number(r.amountAfterTds).toLocaleString("en-IN") : (r.category === "Refund" || r.category === "Fellowship" ? Number(r.amount).toLocaleString("en-IN") : Number(r.amount * 0.9).toLocaleString("en-IN"))}
                          </td>
                          <td className="px-2 py-1 border-r border-gray-300 text-gray-500 font-mono text-xs">{r.utr_rrn_reference_number || r.utrRrnReferenceNumber || "—"}</td>
                          <td className="px-2 py-1 border-r border-gray-300">
                            <span
                              className="inline-block text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                              style={
                                status === "Approved" || status === "Paid"
                                  ? { background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" }
                                  : status === "Rejected"
                                  ? { background: "#fef2f2", color: "#dc2626", borderColor: "#fca5a5" }
                                  : status === "Pending Registrar Approval"
                                  ? { background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }
                                  : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }
                              }
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => setPreviewRecord(r)}
                                className="text-[11px] font-bold uppercase tracking-wider text-black border border-gray-300 hover:bg-gray-100 px-2 py-0.5 rounded transition-colors shadow-sm bg-white"
                              >
                                Preview
                              </button>
                              {status === "Pending Registrar Approval" && (
                                <>
                                  <button
                                    onClick={() => openApproveModal(r)}
                                    className="text-[11px] font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded transition-colors shadow-sm"
                                    style={{ background: DB }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#333")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = DB)}
                                  >
                                    Approve
                                  </button>
                                  <button
                                  onClick={() => openRejectModal(r._id)}
                                  className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border transition-colors shadow-sm"
                                  style={{ color: "#c2410c", borderColor: "#fdba74", background: "#fff" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fff7ed")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                                >
                                  Reject
                                </button>
                                </>
                              )}
                              {(status === "Form Pending" || status === "Pending Admin Approval" || status === "Approved") && (
                                <button
                                  onClick={() => openRejectModal(r._id)}
                                  className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border transition-colors shadow-sm"
                                  style={{ color: "#c2410c", borderColor: "#fdba74", background: "#fff" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fff7ed")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                                >
                                  Reject
                                </button>
                              )}
                              {status === "Rejected" && r.rejectionReason && (
                                <span className="text-[9px] italic text-red-500 max-w-[120px] truncate" title={r.rejectionReason}>
                                  ↳ {r.rejectionReason}
                                </span>
                              )}
                              {/* Req 16: Delete button — limited to Registrar only */}
                              <button
                                onClick={() => handleDelete(r._id)}
                                className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border transition-colors"
                                style={{ color: "#800000", borderColor: "#800000", background: "#fff" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#800000"; e.currentTarget.style.color = "#fff"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#800000"; }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
      {previewRecord && (
        <PreviewModal record={previewRecord} onClose={() => setPreviewRecord(null)} />
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
              <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="regRejectReason">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                id="regRejectReason"
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

      {/* ── Approve Confirmation Modal ── */}
      {approveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setApproveModal(null); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" style={{ border: "1px solid #e5e7eb" }}>
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-black" style={{ fontFamily: "Tahoma, Geneva, sans-serif" }}>
                  Confirm Approval
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">This will forward the record for payment processing.</p>
              </div>
              <button
                onClick={() => setApproveModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none mt-0.5"
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700">
                Are you sure you want to approve the application for{" "}
                <span className="font-bold text-black">{approveModal.name}</span>?
              </p>
              <p className="text-xs text-gray-400 mt-2">This action will mark the record as Registrar-approved and ready for payment.</p>
            </div>
            <div className="px-6 pb-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setApproveModal(null)}
                className="text-sm font-medium text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                disabled={approveSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={submitApprove}
                disabled={approveSubmitting}
                className="text-sm font-bold text-white px-5 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "black" }}
                onMouseEnter={(e) => { if (!approveSubmitting) e.currentTarget.style.background = "#333"; }}
                onMouseLeave={(e) => { if (!approveSubmitting) e.currentTarget.style.background = "black"; }}
              >
                {approveSubmitting ? "Approving…" : "Confirm Approval"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

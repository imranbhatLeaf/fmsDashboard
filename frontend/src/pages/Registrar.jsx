import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logomain.avif";
import asssrLogo from "../assets/asssr.avif";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

const CATEGORIES = ["Salary", "Fellowship", "Honorarium", "Refund", "TA/DA"];

const DB = "#1b3358";

export default function Registrar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("all");
  const [records, setRecords]               = useState([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState(null);

  // Summary counts
  const [summary, setSummary] = useState({ total: 0, sent: 0, pending: 0, failed: 0 });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = activeCategory === "all" ? "" : `?category=${encodeURIComponent(activeCategory)}`;
      const res = await fetch(`${API_BASE}/api/records${query}`);
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
  }, [activeCategory]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function handleApprove(id) {
    try {
      const res = await fetch(`${API_BASE}/api/records/${id}/approve`, { method: "PUT" });
      if (!res.ok) throw new Error("Approval failed");
      setRecords((prev) => prev.map((r) => r._id === id ? { ...r, registrarApproved: true } : r));
    } catch (err) {
      alert(err.message);
    }
  }

  const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div className="min-h-screen font-sans" style={{ background: "#f4f2ed", color: "#1b2230" }}>

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
            <span className="font-serif text-lg font-bold" style={{ color: DB }}>AFMS 2026</span>
            <span className="hidden md:inline text-[#ccc] mx-2">·</span>
            <span className="hidden md:inline text-xs text-[#99a] uppercase tracking-widest">Registrar View</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-xs text-[#aab]">
            Signed in as <span className="font-semibold" style={{ color: DB }}>{auth?.username}</span>
          </span>
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

      <main className="px-6 md:px-10 py-8 max-w-5xl">

        {/* Page title */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold" style={{ color: DB }}>Transaction Overview</h1>
          <p className="text-sm mt-1" style={{ color: "#8899aa" }}>View all financial transactions and their email status.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Transactions", value: summary.total },
            { label: "Emails Sent",        value: summary.sent },
            { label: "Pending",            value: summary.pending },
            { label: "Failed",             value: summary.failed },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border px-5 py-4" style={{ borderColor: "#dde3ec" }}>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: "#99aabb" }}>{stat.label}</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: DB }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Total amount card */}
        <div className="rounded-xl px-6 py-5 mb-8 flex items-center justify-between" style={{ background: DB }}>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Total Amount</p>
            <p className="font-serif text-3xl font-bold tabular-nums text-white">
              ₹{totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="text-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
            </svg>
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {["all", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors"
              style={
                activeCategory === cat
                  ? { background: DB, color: "#fff", borderColor: DB }
                  : { background: "#fff", color: "#556", borderColor: "#dde3ec" }
              }
              onMouseEnter={(e) => {
                if (activeCategory !== cat) {
                  e.currentTarget.style.borderColor = "#9aaac8";
                  e.currentTarget.style.color = DB;
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== cat) {
                  e.currentTarget.style.borderColor = "#dde3ec";
                  e.currentTarget.style.color = "#556";
                }
              }}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading && <p className="text-sm" style={{ color: "#aab" }}>Loading transactions…</p>}
        {error && (
          <p className="text-sm border rounded-lg px-4 py-3 bg-white" style={{ color: "#556", borderColor: "#dde3ec" }}>{error}</p>
        )}
        {!loading && !error && records.length === 0 && (
          <p className="text-sm" style={{ color: "#aab" }}>No transactions found for this category.</p>
        )}
        {!loading && !error && records.length > 0 && (
          <div className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: "#dde3ec" }}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {["Name", "Email", "Amount", "After TDS", "Payment Type", "Component", "Status", "Action"].map((h) => (
                    <th
                      key={h}
                      className={`text-[10px] uppercase tracking-widest px-4 py-3 border-b font-semibold ${(h === "Amount" || h === "After TDS") ? "text-right" : "text-left"}`}
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
                  if (r.registrarApproved) status = "Approved";
                  if (r.paymentProcessed) status = "Paid";
                  
                  return (
                    <tr
                      key={r._id || r.email}
                      className="transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f7fb")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td className="px-4 py-3 border-b font-semibold" style={{ borderColor: "#edf0f7", color: DB }}>{r.name}</td>
                      <td className="px-4 py-3 border-b" style={{ borderColor: "#edf0f7", color: "#556" }}>{r.email}</td>
                      <td className="px-4 py-3 border-b text-right font-mono tabular-nums font-semibold" style={{ borderColor: "#edf0f7", color: DB }}>
                        ₹{Number(r.amount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 border-b text-right font-mono tabular-nums font-semibold" style={{ borderColor: "#edf0f7", color: DB }}>
                        ₹{r.amountAfterTds ? Number(r.amountAfterTds).toLocaleString("en-IN") : Number(r.amount * 0.9).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 border-b" style={{ borderColor: "#edf0f7", color: "#556" }}>{r.category}</td>
                      <td className="px-4 py-3 border-b" style={{ borderColor: "#edf0f7", color: "#556" }}>{r.services}</td>
                      <td className="px-4 py-3 border-b" style={{ borderColor: "#edf0f7" }}>
                        <span
                          className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                          style={
                            status === "Approved" || status === "Paid"
                              ? { background: "#e6f4ea", color: "#137333", borderColor: "#ceead6" }
                              : status === "Needs Approval"
                              ? { background: "#fef7e0", color: "#b06000", borderColor: "#feefc3" }
                              : { background: "#fff", color: "#99a", borderColor: "#e0e4ee" }
                          }
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b" style={{ borderColor: "#edf0f7" }}>
                        {status === "Needs Approval" && (
                          <button
                            onClick={() => handleApprove(r._id)}
                            className="text-[10px] font-bold uppercase tracking-wider text-white px-3 py-1.5 rounded-md transition-colors"
                            style={{ background: DB }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#152849")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = DB)}
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

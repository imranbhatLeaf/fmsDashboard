import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function formatAmount(amount) {
  return Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

function getCurrentFY() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

const SERVICE_FULL = {
  ASSSR: "Asiatic Society for Social Science Research",
  VMI: "Varāhamihira Multidisciplinary Institute",
  DHC: "Deccan History Congress",
  JASSSR: "JASSSR",
};

// Barcode component using canvas — no external library needed
function Barcode({ value }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const barWidth = 2;
    const barHeight = 50;
    const padding = 10;

    const chars = value.toUpperCase().split("");
    const pattern = chars.flatMap((c) => {
      const code = c.charCodeAt(0);
      return [
        1, 0,
        (code >> 5) & 1, (code >> 4) & 1, (code >> 3) & 1,
        (code >> 2) & 1, (code >> 1) & 1, code & 1,
        0,
      ];
    });

    const totalWidth = pattern.length * barWidth + padding * 2;
    canvas.width = totalWidth;
    canvas.height = barHeight + 20;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    pattern.forEach((bit, i) => {
      ctx.fillStyle = bit ? "#1b2430" : "#ffffff";
      ctx.fillRect(padding + i * barWidth, 0, barWidth, barHeight);
    });

    ctx.fillStyle = "#1b2430";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${value}`, totalWidth / 2, barHeight + 14);
  }, [value]);

  return (
    <canvas
      ref={canvasRef}
      style={{ imageRendering: "pixelated", maxWidth: "100%" }}
    />
  );
}

export default function ReceiptPage() {
  const { token } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRecord() {
      try {
        const res = await fetch(`${API_BASE}/api/form/receipt/${token}`);
        if (!res.ok) { setError("invalid"); return; }
        const data = await res.json();
        setRecord(data);
      } catch {
        setError("network");
      } finally {
        setLoading(false);
      }
    }
    fetchRecord();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f6f2] flex items-center justify-center">
        <p className="text-[#5a6270] text-sm">Loading receipt…</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-[#f8f6f2] flex items-center justify-center px-4">
        <div className="bg-white border border-[#e4dfd4] rounded-xl p-8 max-w-md text-center">
          <h2 className="font-serif text-xl font-semibold mb-2 text-[#8c4a4a]">Receipt not found</h2>
          <p className="text-sm text-[#5a6270]">This receipt link is invalid. Please contact the accounts section.</p>
        </div>
      </div>
    );
  }

  const gross = Number(record.amount);
  const net = Number(record.amountAfterTds);
  const tds = gross - net;
  const formData = record.formData || {};
  const submittedAt = record.updatedAt || record.createdAt;

  // Receipt number: service prefix + year + 4-digit seq, fallback to token
  const utrn = record.receiptNumber || record.token.split("-")[0].toUpperCase();

  function formatIP(ip) {
    if (!ip) return "127.0.0.1";
    let cleanIp = ip.split(",")[0].trim();
    if (cleanIp === "::1") return "127.0.0.1";
    if (cleanIp.startsWith("::ffff:")) return cleanIp.substring(7);
    return cleanIp;
  }

  return (
    <div className="min-h-screen bg-white py-10 px-4">
      {/* Print button */}
      <div className="max-w-3xl mx-auto mb-4 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-black text-white text-sm font-semibold px-5 py-2.5 hover:bg-gray-800 transition-colors"
        >
          Print / Save PDF
        </button>
      </div>

      {/* Receipt */}
      <div className="max-w-3xl mx-auto bg-white border border-black p-8">
        {/* Header */}
        <div className="text-center mb-6 border-b border-black pb-4">
          <h1 className="font-bold text-xl">{SERVICE_FULL[record.services]}</h1>
          <p className="text-sm font-semibold mt-1">Financial Year: {getCurrentFY()}</p>
        </div>

        {/* Receipt title */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="font-bold">{record.category} Receipt</p>
            <p className="text-sm">For Record Purposes Against Payments Made</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <p className="text-xs font-bold">Unique Transaction Reference Number</p>
            <p className="font-mono text-sm font-bold">{utrn}</p>
            <div className="mt-1">
              <Barcode value={utrn} />
            </div>
          </div>
        </div>

        {/* Main details */}
        <table className="w-full text-sm border-collapse border border-black mb-6">
          <tbody>
            <Row label="Date of Transfer" value={formatDate(record.dateOfTransfer || record.paymentProcessedAt)} />
            <Row label="Name of Claimant / Payee" value={record.name} />
            <Row label="Bank" value={formData.bankName || "—"} />
            <Row label="Account Number" value={formData.bankAccountNumber || "—"} />
            <Row label="Indian Financial System Code" value={formData.bankIfsc || "—"} />
            <Row label="Payment Type" value={record.category} />
            <Row label="Bank Reference No." value={record.bankReferenceNo || "—"} />
            <Row label="Component" value={record.services} />
          </tbody>
        </table>

        {/* Settlement */}
        <div className="mb-2 font-bold text-sm">Details of Payment Settlement</div>
        <table className="w-full text-sm border-collapse border border-black mb-6">
          <tbody>
            <tr>
              <td className="px-4 py-2 border border-black font-bold w-48">Gross Amount</td>
              <td className="px-4 py-2 border border-black text-right">₹ {formatAmount(gross)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border border-black font-bold">Less: Tax Deducted at Source</td>
              <td className="px-4 py-2 border border-black text-right">₹ {formatAmount(tds)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 border border-black font-bold">Net Amount Payable</td>
              <td className="px-4 py-2 border border-black text-right font-bold">₹ {formatAmount(net)}</td>
            </tr>
          </tbody>
        </table>

        {/* Dates */}
        <div className="mb-6 p-4 border border-black text-sm">
          <p className="font-bold mb-2">Processing Dates:</p>
          <ul className="list-style-none space-y-1 pl-0">
            <li><strong>Date of Entry:</strong> {formatDate(record.dateOfEntry || record.createdAt)}</li>
            <li><strong>Date of Upload:</strong> {formatDate(record.dateOfUpload || record.updatedAt || record.createdAt)}</li>
            <li><strong>Date of Forwarding:</strong> {formatDate(record.dateOfForwarding || record.adminApprovedAt)}</li>
            <li><strong>Date of Approval:</strong> {formatDate(record.dateOfApproval || record.registrarApprovedAt)}</li>
          </ul>
        </div>

        <div className="mb-6 border border-black p-4 text-sm">
          <p className="font-bold mb-2">Verification</p>
          <p className="leading-relaxed">
            {record.category} Receipt electronically transmitted on{" "}
            <strong>{formatDate(submittedAt)}</strong> at{" "}
            <strong>{formatTime(submittedAt)}</strong> for an amount of{" "}
            <strong>₹ {formatAmount(net)}/-</strong> from Internet Protocol address{" "}
            <strong>{formatIP(record.submittedIp)}</strong> and verified by{" "}
            <strong>{record.name}</strong> having{" "}
            <strong>Permanent Account Number ({formData.pan || "—"})</strong> using Electronic Verification Code{" "}
            <strong>{utrn}</strong> generated through Email / Mobile One-Time Password mode.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs border-t border-black pt-4">
          This document has been generated electronically and is valid without a physical signature.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <tr>
      <td className="px-4 py-2 border border-black font-bold w-48">{label}</td>
      <td className="px-4 py-2 border border-black">{value}</td>
    </tr>
  );
}

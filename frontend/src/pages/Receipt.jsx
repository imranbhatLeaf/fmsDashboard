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
    ctx.fillText(`AFMS-${value}`, totalWidth / 2, barHeight + 14);
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

  return (
    <div className="min-h-screen bg-[#f8f6f2] py-10 px-4 print:bg-white print:py-0">
      {/* Print button */}
      <div className="max-w-3xl mx-auto mb-4 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-[#15243d] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#1f3354] transition-colors"
        >
          Print / Save PDF
        </button>
      </div>

      {/* Receipt */}
      <div className="max-w-3xl mx-auto bg-white border border-[#e4dfd4] rounded-xl overflow-hidden print:border print:rounded-none print:shadow-none">
        {/* Header */}
        <div className="bg-[#15243d] text-white px-8 py-5 flex justify-between items-start">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50 mb-0.5">{record.services}</p>
            <h1 className="font-serif text-lg font-semibold">{SERVICE_FULL[record.services]}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50 uppercase tracking-wider">Financial Year</p>
            <p className="text-sm font-semibold">{getCurrentFY()}</p>
          </div>
        </div>

        {/* Receipt title */}
        <div className="border-b border-[#e4dfd4] px-8 py-4 flex justify-between items-center bg-[#fbfaf7]">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#5a6270]">
              {record.category} Receipt
            </p>
            <p className="text-[11px] text-[#5a6270]">For Record Purposes Against Payments Made</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#5a6270] uppercase tracking-wider">AFMS-UTRN</p>
            <p className="font-mono text-sm font-semibold text-[#1b2430]">{utrn}</p>
          </div>
        </div>

        <div className="px-8 py-6">
          {/* Main details */}
          <table className="w-full text-sm border border-[#e4dfd4] rounded-lg overflow-hidden">
            <tbody>
              <Row label="Date of Transfer" value={formatDate(submittedAt)} />
              <Row label="Name of Claimant / Payee" value={record.name} />
              <Row label="Bank" value={formData.bankName || "—"} />
              <Row label="Account Number" value={formData.bankAccountNumber || "—"} />
              <Row label="IFSC" value={formData.bankIfsc || "—"} />
              <Row label="Payment Type" value={record.category} />
              <Row label="Bank Reference No." value="—" />
              <Row label="Component" value={record.services} />
            </tbody>
          </table>

          {/* Settlement */}
          <table className="w-full text-sm border border-[#e4dfd4] rounded-lg overflow-hidden mt-4">
            <tbody>
              <tr className="border-b border-[#e4dfd4]">
                <td className="px-4 py-2.5 text-[#5a6270] w-32">Settlement</td>
                <td className="px-4 py-2.5 text-[#5a6270]">Gross Amount</td>
                <td className="px-4 py-2.5 text-right font-mono">₹ {formatAmount(gross)}</td>
              </tr>
              <tr className="border-b border-[#e4dfd4]">
                <td className="px-4 py-2.5"></td>
                <td className="px-4 py-2.5 text-[#5a6270]">Less: TDS (if applicable)</td>
                <td className="px-4 py-2.5 text-right font-mono text-[#8c4a4a]">₹ {formatAmount(tds)}</td>
              </tr>
              <tr className="bg-[#fbfaf7]">
                <td className="px-4 py-2.5"></td>
                <td className="px-4 py-2.5 font-semibold text-[#1b2430]">Net Amount Payable</td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-[#1b2430]">₹ {formatAmount(net)}</td>
              </tr>
            </tbody>
          </table>

          {/* Verification */}
          <div className="mt-6 border border-[#e4dfd4] rounded-lg p-4 bg-[#fbfaf7]">
            <p className="text-[11px] uppercase tracking-widest text-[#5a6270] font-semibold mb-2">Verification</p>
            <p className="text-xs text-[#1b2430] leading-relaxed">
              {record.category} Receipt electronically transmitted on{" "}
              <strong>{formatDate(submittedAt)}</strong> at{" "}
              <strong>{formatTime(submittedAt)}</strong> for an amount of{" "}
              <strong>₹ {formatAmount(net)}/-</strong> from IP address{" "}
              <strong>{record.submittedIp || "0.0.0.0"}</strong> and verified by{" "}
              <strong>{record.name}</strong> having{" "}
              <strong>PAN ({formData.pan || "—"})</strong> using Electronic Verification Code{" "}
              <strong>{utrn}</strong> generated through Email / Mobile OTP mode.
            </p>
          </div>

          {/* Barcode section */}
          <div className="mt-6 border border-[#e4dfd4] rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[#5a6270] font-semibold mb-2">System Generated</p>
              <Barcode value={utrn} />
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-widest text-[#5a6270] font-semibold mb-1">AFMS-UTRN</p>
              <p className="font-mono text-lg font-bold text-[#1b2430]">{utrn}</p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-4 text-center text-[11px] text-[#5a6270] border-t border-[#e4dfd4] pt-4">
            This document has been generated electronically and is valid without a physical signature.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <tr className="border-b border-[#e4dfd4] last:border-b-0">
      <td className="px-4 py-2.5 text-[#5a6270] w-48 bg-[#fbfaf7] text-xs uppercase tracking-wide">{label}</td>
      <td className="px-4 py-2.5 text-[#1b2430] font-medium">{value}</td>
    </tr>
  );
}

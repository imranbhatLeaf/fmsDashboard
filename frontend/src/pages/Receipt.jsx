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

    const barWidth = 1.3;
    const barHeight = 24;
    const padding = 3;

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
    canvas.height = barHeight;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    pattern.forEach((bit, i) => {
      ctx.fillStyle = bit ? "#000000" : "#ffffff";
      ctx.fillRect(padding + i * barWidth, 0, barWidth, barHeight);
    });
  }, [value]);

  return (
    <canvas
      ref={canvasRef}
      style={{ imageRendering: "pixelated", maxWidth: "100%", display: "block" }}
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
    window.location.href = `/form/${token}`;
    return null;
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
    <div className="min-h-screen bg-[#eceded] py-8 px-4 font-sans">
      <style>{`
        .receipt-serif { font-family: Georgia, 'Times New Roman', serif; }
        table.doc-table td { vertical-align: top; }
        @media print {
          @page {
            size: A4 portrait;
            margin: 14mm 16mm;
          }
          body {
            background: white !important;
          }
        }
      `}</style>

      {/* Print button */}
      <div className="max-w-[794px] mx-auto mb-3 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="bg-black text-white text-xs font-semibold px-4 py-2 hover:bg-gray-800 transition-colors"
        >
          Print / Save PDF
        </button>
      </div>

      {/* Receipt */}
      <div className="receipt-serif max-w-[794px] mx-auto bg-white border border-black px-10 py-7">

        {/* Letterhead */}
        <div className="text-center mb-0.5">
          <p className="font-sans text-[8px] tracking-[0.18em] text-gray-500 uppercase mb-0.5">Official Payment Receipt</p>
          <h1 className="font-bold text-[14px] leading-tight tracking-wide">{SERVICE_FULL[record.services]?.toUpperCase()}</h1>
          <p className="text-[9.5px] text-gray-700">Financial Year {getCurrentFY()}</p>
        </div>
        <div className="border-t-[2px] border-black mt-2 mb-0.5"></div>
        <div className="border-t border-black mb-3"></div>

        {/* Title bar */}
        <div className="font-sans flex items-center justify-between mb-3">
          <div>
            <p className="font-bold text-[10.5px] uppercase tracking-wide">{record.category} Receipt</p>
            <p className="text-[8.5px] text-gray-500">For record purposes against payment made</p>
          </div>
          <div className="text-right">
            <p className="text-[7.5px] font-semibold uppercase tracking-wide text-gray-500">UTR No.</p>
            <p className="font-mono font-bold text-[10.5px]">{utrn}</p>
          </div>
        </div>

        {/* Payee / bank details table */}
        <table className="doc-table w-full border-collapse border border-black text-[10px] mb-3 font-sans">
          <tbody>
            <tr>
              <td className="border border-black bg-gray-50 font-semibold px-2 py-1 w-[22%]">Name of Payee</td>
              <td className="border border-black px-2 py-1" colSpan={3}>{record.name}</td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-50 font-semibold px-2 py-1">Date of Transfer</td>
              <td className="border border-black px-2 py-1 w-[28%]">{formatDate(record.dateOfTransfer || record.paymentProcessedAt)}</td>
              <td className="border border-black bg-gray-50 font-semibold px-2 py-1 w-[22%]">Payment Type</td>
              <td className="border border-black px-2 py-1">{record.category}</td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-50 font-semibold px-2 py-1">Component</td>
              <td className="border border-black px-2 py-1">{record.services}</td>
              <td className="border border-black bg-gray-50 font-semibold px-2 py-1">Bank</td>
              <td className="border border-black px-2 py-1">{formData.bankName || "—"}</td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-50 font-semibold px-2 py-1">Account Number</td>
              <td className="border border-black px-2 py-1">{formData.bankAccountNumber || "—"}</td>
              <td className="border border-black bg-gray-50 font-semibold px-2 py-1">IFSC Code</td>
              <td className="border border-black px-2 py-1">{formData.bankIfsc || "—"}</td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-50 font-semibold px-2 py-1">Bank Ref. No.</td>
              <td className="border border-black px-2 py-1" colSpan={3}>{record.bankReferenceNo || "—"}</td>
            </tr>
          </tbody>
        </table>

        {/* Settlement table */}
        <table className="doc-table w-full border-collapse border border-black text-[10px] mb-3 font-sans">
          <tbody>
            <tr>
              <td className="border border-black bg-gray-50 font-semibold px-2 py-1 w-1/3">Gross Amount</td>
              <td className="border border-black px-2 py-1 text-right w-2/3" colSpan={2}>₹ {formatAmount(gross)}</td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-50 font-semibold px-2 py-1">Tax Deducted at Source</td>
              <td className="border border-black px-2 py-1 text-right" colSpan={2}>₹ {formatAmount(tds)}</td>
            </tr>
            <tr>
              <td className="border border-black bg-black text-white font-bold px-2 py-1">Net Amount Payable</td>
              <td className="border border-black bg-black text-white font-bold px-2 py-1 text-right" colSpan={2}>₹ {formatAmount(net)}</td>
            </tr>
          </tbody>
        </table>

        {/* Processing dates table */}
        <table className="doc-table w-full border-collapse border border-black text-[10px] mb-3 font-sans">
          <tbody>
            <tr>
              <td className="border border-black bg-gray-50 font-semibold px-2 py-1 w-1/4">Entry</td>
              <td className="border border-black bg-gray-50 font-semibold px-2 py-1 w-1/4">Upload</td>
              <td className="border border-black bg-gray-50 font-semibold px-2 py-1 w-1/4">Forwarding</td>
              <td className="border border-black bg-gray-50 font-semibold px-2 py-1 w-1/4">Approval</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1">{formatDate(record.dateOfEntry || record.createdAt)}</td>
              <td className="border border-black px-2 py-1">{formatDate(record.dateOfUpload || record.updatedAt || record.createdAt)}</td>
              <td className="border border-black px-2 py-1">{formatDate(record.dateOfForwarding || record.adminApprovedAt)}</td>
              <td className="border border-black px-2 py-1">{formatDate(record.dateOfApproval || record.registrarApprovedAt)}</td>
            </tr>
          </tbody>
        </table>

        {/* Barcode + verification */}
        <table className="doc-table w-full border-collapse border border-black text-[8.5px] mb-3 font-sans">
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1.5 align-middle" style={{ width: "110px" }}>
                <Barcode value={utrn} />
              </td>
              <td className="border border-black px-2 py-1.5 leading-snug text-gray-800">
                <span className="font-semibold uppercase tracking-wide text-gray-500 text-[7px] block mb-0.5">Verification</span>
                {record.category} Receipt transmitted on <strong className="text-black">{formatDate(submittedAt)}</strong> at{" "}
                <strong className="text-black">{formatTime(submittedAt)}</strong> for{" "}
                <strong className="text-black">₹ {formatAmount(net)}/-</strong> from IP{" "}
                <strong className="text-black">{formatIP(record.submittedIp)}</strong>, verified by{" "}
                <strong className="text-black">{record.name}</strong> (PAN{" "}
                <strong className="text-black">{formData.pan || "—"}</strong>) via EVC{" "}
                <strong className="text-black">{utrn}</strong>, Email / Mobile OTP.
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <p className="font-sans text-center text-[8px] text-gray-500 border-t border-black pt-2">
          Generated electronically — valid without a physical signature.
        </p>
      </div>
    </div>
  );
}
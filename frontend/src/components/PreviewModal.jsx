import React from 'react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : "-";
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString() : "-";

export default function PreviewModal({ record, onClose }) {
  if (!record) return null;

  const gross = Number(record.amount);
  const tdsAmt = record.amountAfterTds ? gross - Number(record.amountAfterTds) : (record.category === "Refund" || record.category === "TA/DA" ? 0 : gross * 0.1);
  const net = record.amountAfterTds ? Number(record.amountAfterTds) : gross - tdsAmt;
  const utrn = record.receiptNumber || record.token?.split("-")[0].toUpperCase();
  const formData = record.formData || {};

  // Collect all formData keys to display them as a preview (Req 20)
  const formDataEntries = Object.entries(formData).filter(
    ([key]) => !['__v'].includes(key)
  );

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity print:hidden" 
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#FAF9F6] shadow-xl z-50 overflow-y-auto border-l border-gray-200 transform transition-transform">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0">
          <h2 className="text-lg font-bold">Transaction Preview</h2>
          <div className="flex items-center gap-2">
            {/* Req 20: Print button for Admin and Registrar */}
            <button
              onClick={() => window.print()}
              className="text-[10px] font-bold uppercase tracking-wider text-white bg-black hover:bg-gray-800 px-3 py-1.5 rounded-md transition-colors shadow-sm print:hidden"
            >
              Print
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-black print:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-gray-500">UTRN</p>
            <p className="font-mono font-bold text-lg">{utrn}</p>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase text-gray-500">Component</p>
                <p className="font-medium text-sm">{record.services}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Category</p>
                <p className="font-medium text-sm">{record.category}</p>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase border-b border-gray-100 pb-2 mb-3">User Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{record.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{record.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{formData.mobile || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">PAN</span><span>{formData.pan || "—"}</span></div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase border-b border-gray-100 pb-2 mb-3">Bank Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">{formData.bankName || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Account No.</span><span className="font-mono">{formData.bankAccountNumber || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">IFSC</span><span className="font-mono">{formData.bankIfsc || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Beneficiary</span><span>{formData.bankBeneficiaryName || "—"}</span></div>
            </div>
          </div>

          {/* Amount Details */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase border-b border-gray-100 pb-2 mb-3">Amounts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Gross Amount</span><span className="font-mono">₹{gross.toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">TDS Deduction</span><span className="font-mono text-red-600">₹{tdsAmt.toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between font-bold border-t border-gray-100 pt-2"><span className="text-gray-800">Net Amount</span><span className="font-mono text-green-700">₹{net.toLocaleString("en-IN")}</span></div>
            </div>
          </div>

          {/* Bank Reference & Date of Transfer (Req 17) */}
          {(record.bankReferenceNo || record.dateOfTransfer) && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase border-b border-gray-100 pb-2 mb-3">Payment Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Bank Reference No.</span><span className="font-mono">{record.bankReferenceNo || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date of Transfer</span><span>{fmtDate(record.dateOfTransfer)}</span></div>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase border-b border-gray-100 pb-2 mb-3">Processing Dates</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Entry</span><span>{fmtDate(record.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Upload</span><span>{record.formSubmitted ? fmtDate(record.updatedAt) : "Pending"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Forwarding</span><span>{record.adminApprovedAt ? fmtDate(record.adminApprovedAt) : "Pending"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Approval</span><span>{record.registrarApprovedAt ? fmtDate(record.registrarApprovedAt) : "Pending"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Transfer</span><span>{record.paymentProcessedAt ? fmtDate(record.paymentProcessedAt) : "Pending"}</span></div>
            </div>
          </div>

          {/* Req 20: Full Filled Form Data Preview */}
          {formDataEntries.length > 0 && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase border-b border-gray-100 pb-2 mb-3">Submitted Form Data</h3>
              <div className="space-y-2 text-sm">
                {formDataEntries.map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4">
                    <span className="text-gray-500 capitalize shrink-0">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-right break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value || "—")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

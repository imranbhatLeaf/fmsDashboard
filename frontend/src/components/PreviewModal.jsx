import React from 'react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : "-";
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString() : "-";

export default function PreviewModal({ record, onClose }) {
  if (!record) return null;

  const gross = Number(record.amount);
  const tdsAmt = record.amountAfterTds ? gross - Number(record.amountAfterTds) : (record.category === "Refund" || record.category === "Fellowship" ? 0 : gross * 0.1);
  const net = record.amountAfterTds ? Number(record.amountAfterTds) : gross - tdsAmt;
  const utrn = record.receiptNumber || record.token?.split("-")[0].toUpperCase();
  const formData = record.formData || {};

  // Collect all formData keys to display them as a preview (Req 20)
  const formDataEntries = Object.entries(formData).filter(
    ([key]) => !['__v'].includes(key)
  );

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm 14mm; }
          body * { visibility: hidden !important; }
          #preview-print-root * { visibility: visible !important; }
          #preview-print-root { visibility: visible !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; width: 100% !important; max-width: 100% !important; height: auto !important; max-height: none !important; overflow: visible !important; background: white !important; box-shadow: none !important; border: none !important; transform: none !important; }
          #preview-print-root .print-hidden { visibility: hidden !important; display: none !important; }
          #preview-print-root .sticky { position: relative !important; }
          #preview-print-root .overflow-y-auto { overflow: visible !important; max-height: none !important; }
        }
      `}</style>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity print:hidden print-hidden"
        onClick={onClose}
      />
      <div id="preview-print-root" className="fixed inset-y-0 right-0 w-full max-w-md bg-[#FAF9F6] shadow-xl z-50 overflow-y-auto border-l border-gray-200 transform transition-transform print:absolute print:inset-0 print:w-full print:max-w-none print:bg-white print:border-none print:shadow-none">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0">
          <h2 className="text-lg font-bold">Transaction Preview</h2>
          <div className="flex items-center gap-2 print-hidden">
            {/* Req 20: Print official receipt */}
            <button
              onClick={() => window.print()}
              className="text-[10px] font-bold uppercase tracking-wider text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors shadow-sm print:hidden"
            >
              Print Preview
            </button>
            <button
              onClick={() => {
                if (!record.bankReferenceNo || !record.dateOfTransfer) {
                  alert("Receipt cannot be generated or printed without Bank Reference Number and Date of Transfer.");
                  return;
                }
                window.open(`/receipt/${record.token}`, '_blank');
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-white bg-black hover:bg-gray-800 px-3 py-1.5 rounded-md transition-colors shadow-sm print:hidden"
            >
              Print Receipt
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
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{formData.mobile || record.phoneMobile || record.phone_mobile || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">PAN</span><span>{formData.pan || record.pan || record.pan_number || "—"}</span></div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase border-b border-gray-100 pb-2 mb-3">Bank Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Bank Name</span><span className="font-medium">{formData.bankName || record.bank_name || record.bankName || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Account No.</span><span className="font-mono">{formData.bankAccountNumber || record.account_number || record.bankAccountNumber || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">IFSC</span><span className="font-mono">{formData.bankIfsc || record.ifsc_code || record.bankIfsc || "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Beneficiary</span><span>{formData.bankBeneficiaryName || record.beneficiary_name || record.bankBeneficiaryName || "—"}</span></div>
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
           {/* Journey Details (TA/DA only) */}
          {record.category === "TA/DA" && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase border-b border-gray-100 pb-2 mb-3">Journey Details</h3>
              <div className="space-y-2 text-sm">
                {(record.journeyRows || []).map((row, idx) => (
                  <div key={idx} className="border-b pb-2 mb-2">
                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Primary Journey {idx + 1}</p>
                    <div className="flex justify-between"><span className="text-gray-500">From</span><span>{row.journey_from || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">To</span><span>{row.journey_to || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Mode</span><span>{row.journey_mode || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-mono">₹{Number(row.journey_amount || 0).toLocaleString("en-IN")}</span></div>
                  </div>
                ))}
                {(record.localJourneyRows || []).filter(row => row.local_journey_from).length > 0 && (
                  <>
                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1 mt-2">Local Journey</p>
                    {(record.localJourneyRows || []).filter(row => row.local_journey_from).map((row, idx) => (
                      <div key={idx} className="border-b pb-2 mb-2">
                        <div className="flex justify-between"><span className="text-gray-500">From</span><span>{row.local_journey_from}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">To</span><span>{row.local_journey_to || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Mode</span><span>{row.local_journey_mode || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-mono">₹{Number(row.local_journey_amount || 0).toLocaleString("en-IN")}</span></div>
                      </div>
                    ))}
                  </>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-800">Gross Total</span>
                  <span className="font-mono">₹{(() => { const j = (record.journeyRows || []).reduce((s, r) => s + Number(r.journey_amount || 0), 0); const l = (record.localJourneyRows || []).reduce((s, r) => s + Number(r.local_journey_amount || 0), 0); return (j + l).toLocaleString("en-IN"); })()}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-800">Net Amount (after TDS)</span>
                  <span className="font-mono text-green-700">₹{Number(record.amountAfterTds || record.amount || 0).toLocaleString("en-IN")}</span>
                </div>
                {record.remarks && <div className="text-xs text-gray-500 pt-1"><strong>Remarks:</strong> {record.remarks}</div>}
              </div>
            </div>
          )}
<<<<<<< Updated upstream


=======
>>>>>>> Stashed changes

          {/* Rejection Reason (only shown if rejected) */}
          {record.rejected && record.rejectionReason && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase border-b border-red-200 pb-2 mb-3 text-red-700">Rejection Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-red-600">Rejected By</span>
                  <span className="font-medium capitalize">{record.rejectedBy || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">Rejected On</span>
                  <span>{fmtDate(record.rejectedAt)}</span>
                </div>
                <div className="mt-2">
                  <span className="text-red-600 block mb-1">Reason</span>
                  <span className="font-medium text-gray-800">{record.rejectionReason}</span>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </>
  );
}
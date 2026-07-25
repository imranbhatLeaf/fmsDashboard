import React, { useState } from 'react';

const CSV_FIELDS = [
  "row_id", "component", "form_type", "name", "designation", "pay_level", "address", 
  "phone_office", "phone_mobile", "email", "programme_nature", "programme_title", 
  "participation_type", "lecture_type", "honorarium_basis", "num_presences", "rate", 
  "total_amount", "journey_from", "journey_to", "journey_mode", "journey_amount", 
  "local_journey_from", "local_journey_to", "local_journey_mode", "local_journey_amount", 
  "grand_total", "fellowship_rate", "fellowship_total", "refund_amount_claimed", 
  "payment_receipt_number", "payment_receipt_date", "refund_reason", "academic_year", 
  "category", "services", "amount"
];

export default function RecordModal({ record, onClose, onSave }) {
  const isAdd = !record;
  const [isEditing, setIsEditing] = useState(isAdd);
  const [formData, setFormData] = useState(record || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(formData);
    } catch (err) {
      setError(err.message || "Failed to save record.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity print:hidden" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#FAF9F6] shadow-xl z-50 overflow-y-auto border-l border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-lg font-bold">{isAdd ? "Add Record Entry" : "Record Details"}</h2>
          <div className="flex items-center gap-2">
            {!isAdd && !isEditing && (
              <>
                <button onClick={() => window.print()} className="text-[10px] font-bold uppercase tracking-wider text-white bg-black hover:bg-gray-800 px-3 py-1.5 rounded-md transition-colors print:hidden">Print</button>
                <button onClick={() => setIsEditing(true)} className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors print:hidden">Edit</button>
              </>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-black print:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {!isEditing ? (
            <div className="space-y-4">
              {CSV_FIELDS.map(field => {
                if (formData[field] === undefined || formData[field] === null || formData[field] === "") return null;
                return (
                  <div key={field} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col">
                    <span className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1">{field.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-medium">{String(formData[field])}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {CSV_FIELDS.map(field => (
                <div key={field} className="flex flex-col">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{field.replace(/_/g, ' ')}</label>
                  <input
                    type="text"
                    name={field}
                    value={formData[field] || ""}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>
              ))}
              {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}
              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-[#FAF9F6] pb-4">
                {!isAdd && (
                  <button onClick={() => setIsEditing(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-white transition-colors">
                    Cancel
                  </button>
                )}
                <button onClick={handleSave} disabled={saving} className="text-sm font-semibold px-5 py-2 rounded-lg text-white bg-black hover:bg-gray-800 transition-colors disabled:opacity-50">
                  {saving ? "Saving..." : "Save Record"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

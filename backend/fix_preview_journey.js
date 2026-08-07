const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/PreviewModal.jsx";
let content = fs.readFileSync(path, "utf8");

const oldStr = `              <div className="space-y-2 text-sm">
                {record.journey_from && (
                  <div className="border-b pb-2 mb-2">
                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Primary Journey</p>
                    <div className="flex justify-between"><span className="text-gray-500">From</span><span>{record.journey_from || record.journeyFrom || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">To</span><span>{record.journey_to || record.journeyTo || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Mode</span><span>{record.journey_mode || record.journeyMode || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-mono">₹{Number(record.journey_amount || record.journeyAmount || 0).toLocaleString("en-IN")}</span></div>
                  </div>
                )}
                {(record.local_journey_from || record.localJourneyFrom) && (
                  <div className="border-b pb-2 mb-2">
                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Local Journey</p>
                    <div className="flex justify-between"><span className="text-gray-500">From</span><span>{record.local_journey_from || record.localJourneyFrom || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">To</span><span>{record.local_journey_to || record.localJourneyTo || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Mode</span><span>{record.local_journey_mode || record.localJourneyMode || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-mono">₹{Number(record.local_journey_amount || record.localJourneyAmount || 0).toLocaleString("en-IN")}</span></div>
                  </div>
                )}`;

const newStr = `              <div className="space-y-2 text-sm">
                {(record.journeyRows || []).map((row, idx) => (
                  <div key={idx} className="border-b pb-2 mb-2">
                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Journey {idx + 1}</p>
                    <div className="flex justify-between"><span className="text-gray-500">From</span><span>{row.journey_from || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">To</span><span>{row.journey_to || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Mode</span><span>{row.journey_mode || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-mono">₹{Number(row.journey_amount || 0).toLocaleString("en-IN")}</span></div>
                  </div>
                ))}
                {(record.journeyRows || []).some(r => r.local_journey_from) && (
                  <div className="border-b pb-2 mb-2">
                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Local Journey</p>
                    {(record.journeyRows || []).filter(r => r.local_journey_from).map((row, idx) => (
                      <div key={idx} className="mb-1">
                        <div className="flex justify-between"><span className="text-gray-500">From</span><span>{row.local_journey_from || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">To</span><span>{row.local_journey_to || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Mode</span><span>{row.local_journey_mode || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-mono">₹{Number(row.local_journey_amount || 0).toLocaleString("en-IN")}</span></div>
                      </div>
                    ))}
                  </div>
                )}`;

if (!content.includes(oldStr)) {
  console.log("ERROR: Pattern not found.");
  process.exit(1);
}

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content, "utf8");
console.log("Done.");

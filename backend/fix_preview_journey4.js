const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/PreviewModal.jsx";
let content = fs.readFileSync(path, "utf8");

const oldStr = `                {(record.journeyRows || []).some(row => row.local_journey_from) && (
                  <>
                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Local Journey</p>
                    {(record.journeyRows || []).filter(row => row.local_journey_from).map((row, idx) => (
                      <div key={idx} className="border-b pb-2 mb-2">
                        <div className="flex justify-between"><span className="text-gray-500">From</span><span>{row.local_journey_from}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">To</span><span>{row.local_journey_to || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Mode</span><span>{row.local_journey_mode || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-mono">₹{Number(row.local_journey_amount || 0).toLocaleString("en-IN")}</span></div>
                      </div>
                    ))}
                  </>
                )}`;

const newStr = `                {(record.localJourneyRows || []).filter(row => row.local_journey_from).length > 0 && (
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
                )}`;

if (!content.includes(oldStr)) {
  console.log("ERROR: Pattern not found.");
  process.exit(1);
}

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content, "utf8");
console.log("Done.");

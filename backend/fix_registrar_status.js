const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/pages/Registrar.jsx";
let content = fs.readFileSync(path, "utf8");

const oldStr = `                            >
                              {status}
                            </span>
                          </td>`;

const newStr = `                            >
                              {status}
                              {status === "Paid" && r.dateOfTransfer && (
                                <div className="text-[9px] font-normal normal-case tracking-normal mt-0.5 opacity-80">{fmtDate(r.dateOfTransfer)}</div>
                              )}
                              {status === "Rejected" && r.rejectedAt && (
                                <div className="text-[9px] font-normal normal-case tracking-normal mt-0.5 opacity-80">{fmtDate(r.rejectedAt)}</div>
                              )}
                              {status === "Approved by Registrar, Pending for Payment" && (r.registrarApprovedAt || r.dateOfApproval) && (
                                <div className="text-[9px] font-normal normal-case tracking-normal mt-0.5 opacity-80">{fmtDate(r.registrarApprovedAt || r.dateOfApproval)}</div>
                              )}
                              {status === "Pending Registrar Approval" && (r.adminApprovedAt || r.dateOfForwarding) && (
                                <div className="text-[9px] font-normal normal-case tracking-normal mt-0.5 opacity-80">{fmtDate(r.adminApprovedAt || r.dateOfForwarding)}</div>
                              )}
                              {status === "Approval Pending" && r.dateOfUpload && (
                                <div className="text-[9px] font-normal normal-case tracking-normal mt-0.5 opacity-80">{fmtDate(r.dateOfUpload)}</div>
                              )}
                            </span>
                          </td>`;

if (!content.includes(oldStr)) {
  console.log("ERROR: Pattern not found.");
  process.exit(1);
}

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content, "utf8");
console.log("Done.");

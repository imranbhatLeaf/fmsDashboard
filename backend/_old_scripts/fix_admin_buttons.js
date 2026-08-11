const fs = require("fs");
const path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/pages/Admin.jsx";
let content = fs.readFileSync(path, "utf8");

const oldOrder = `                    onClick={() => openAddModal("salary")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> Salary Form
                  </button>
                  <button
                    onClick={() => openAddModal("refund")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> Refund Form
                  </button>
                  <button
                    onClick={() => openAddModal("fellowship")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> Fellowship Form
                  </button>
                  <button
                    onClick={() => openAddModal("tada")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> TA/DA Bill Form
                  </button>
                  <button
                    onClick={() => openAddModal("honorarium")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> Honorarium Form
                  </button>`;

const newOrder = `                    onClick={() => openAddModal("salary")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> Salary Form
                  </button>
                  <button
                    onClick={() => openAddModal("honorarium")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> Honorarium Form
                  </button>
                  <button
                    onClick={() => openAddModal("fellowship")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> Fellowship Form
                  </button>
                  <button
                    onClick={() => openAddModal("tada")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> TA/DA Bill Form
                  </button>
                  <button
                    onClick={() => openAddModal("refund")}
                    className="flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-lg transition-all border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 text-gray-700 hover:text-black"
                  >
                    <span>+</span> Refund Form
                  </button>`;

if (!content.includes(oldOrder)) {
  console.log("ERROR: Pattern not found. Check for whitespace differences.");
  process.exit(1);
}

content = content.replace(oldOrder, newOrder);
fs.writeFileSync(path, content, "utf8");
console.log("Done. New order: Salary, Honorarium, Fellowship, TA/DA, Refund");

import sys

path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/RecordModal.jsx"

with open(path, "r") as f:
    content = f.read()

old = """  const handleJourneyChange = (index, field, val) => {
    const updated = [...journeyRows];
    updated[index][field] = val;
    setJourneyRows(updated);
  };

  const handleLocalJourneyChange = (index, field, val) => {
    const updated = [...localJourneyRows];
    updated[index][field] = val;
    setLocalJourneyRows(updated);
  };"""

new = """  const handleJourneyChange = (index, field, val) => {
    setJourneyRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: val } : row));
  };

  const handleLocalJourneyChange = (index, field, val) => {
    setLocalJourneyRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: val } : row));
  };"""

if old not in content:
    print("ERROR: Target block not found.")
    sys.exit(1)

with open(path + ".bak4", "w") as f:
    f.write(content)

content = content.replace(old, new, 1)

with open(path, "w") as f:
    f.write(content)

print("Done. Backup saved to RecordModal.jsx.bak4")

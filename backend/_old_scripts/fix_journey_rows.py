import sys

path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/RecordModal.jsx"

with open(path, "r") as f:
    content = f.read()

old = """      setJourneyRows(formData.journeyRows && formData.journeyRows.length > 0 ? formData.journeyRows : [{ journey_from: '', journey_to: '', journey_mode: 'Road', journey_amount: '' }]);
      setLocalJourneyRows(formData.localJourneyRows && formData.localJourneyRows.length > 0 ? formData.localJourneyRows : [{ local_journey_from: '', local_journey_to: '', local_journey_mode: 'Bus', local_journey_amount: '' }]);"""

new = """      setJourneyRows(prev => prev.length > 0 ? prev : (formData.journeyRows && formData.journeyRows.length > 0 ? formData.journeyRows : [{ journey_from: '', journey_to: '', journey_mode: 'Road', journey_amount: '' }]));
      setLocalJourneyRows(prev => prev.length > 0 ? prev : (formData.localJourneyRows && formData.localJourneyRows.length > 0 ? formData.localJourneyRows : [{ local_journey_from: '', local_journey_to: '', local_journey_mode: 'Bus', local_journey_amount: '' }]));"""

if old not in content:
    print("ERROR: Target block not found.")
    sys.exit(1)

with open(path + ".bak3", "w") as f:
    f.write(content)

content = content.replace(old, new, 1)

# Also fix the dependency array
old2 = "  }, [selectedFormType, formData.journeyRows, formData.localJourneyRows]);"
new2 = "  }, [selectedFormType]);"

if old2 in content:
    content = content.replace(old2, new2, 1)
    print("Dependency array fixed too.")
else:
    print("WARNING: Dependency array not found, skipping that fix.")

with open(path, "w") as f:
    f.write(content)

print("Done. Backup saved to RecordModal.jsx.bak3")

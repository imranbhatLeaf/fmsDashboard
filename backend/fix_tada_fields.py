import sys

path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/RecordModal.jsx"

with open(path, "r") as f:
    content = f.read()

old = """    let val = formData[name] || "";
    if (name === 'component' && !val) {
      val = formData.services || "";
    }"""

new = """    let val = formData[name] || "";
    if (name === 'component' && !val) {
      val = formData.services || "";
    }
    if (name === 'nature_of_programme' && !val) {
      val = formData.programme_nature || "";
    }
    if (name === 'title_of_programme' && !val) {
      val = formData.programme_title || "";
    }"""

if old not in content:
    print("ERROR: Target block not found. Already patched or content differs.")
    sys.exit(1)

with open(path + ".bak2", "w") as f:
    f.write(content)

content = content.replace(old, new, 1)

with open(path, "w") as f:
    f.write(content)

print("Done. Backup saved to RecordModal.jsx.bak2")

path = "/home/ubuntu/fms-new/fmsDashboard/frontend/src/components/RecordModal.jsx"

with open(path, "rb") as f:
    content = f.read()

# Check line endings
crlf = content.count(b'\r\n')
lf = content.count(b'\n') - crlf
print(f"CRLF (Windows): {crlf}, LF (Unix): {lf}")

# Check if already patched
if b'Pay Level is required' in content:
    print("Already patched - validation block exists")
else:
    print("NOT patched yet")

# Find the honorarium block and print it raw
idx = content.find(b"selectedFormType === 'honorarium'")
if idx != -1:
    print("\n--- Raw honorarium block (first 800 bytes) ---")
    print(repr(content[idx:idx+800]))
else:
    print("Honorarium block not found at all!")

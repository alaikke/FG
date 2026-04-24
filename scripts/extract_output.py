import json, sys, re

raw = sys.stdin.read().strip()

# Find all text strings that look like AI responses
outputs = re.findall(r'"output":\s*"([^"]+)"', raw)
for i, o in enumerate(outputs):
    try:
        decoded = o.encode().decode('unicode_escape')
    except:
        decoded = o
    print(f"Output {i}: {decoded[:300]}")
    print("---")

# Find any text sent via textMessage
bodies = re.findall(r'"text":"([^"]{10,})"', raw)
for i, b in enumerate(bodies[-5:]):
    try:
        decoded = b.encode().decode('unicode_escape')
    except:
        decoded = b
    print(f"Text {i}: {decoded[:300]}")
    print("---")

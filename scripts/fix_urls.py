#!/usr/bin/env python3
"""Fix the n8n workflow URLs for Docker networking."""
import json

with open("/tmp/wf_current.json") as f:
    data = json.load(f)

wf = data[0] if isinstance(data, list) else data

for n in wf["nodes"]:
    if n["name"] == "Resolver Numero":
        old_code = n["parameters"]["jsCode"]
        # Fix resolver URL: use Docker host gateway
        new_code = old_code.replace("127.0.0.1:3847", "172.17.0.1:3847")
        n["parameters"]["jsCode"] = new_code
        print(f"Fixed Resolver Numero URL")
    
    if n["name"] == "Enviar Resposta WhatsApp":
        # Use public URL since Evolution API is only bound to 127.0.0.1 on host
        n["parameters"]["url"] = "=https://zap.fastgram.com.br/message/sendText/{{ $json.instance }}"
        print(f"Fixed Enviar URL to use public domain")

output = [wf] if isinstance(data, list) else wf
with open("/tmp/wf_fixed.json", "w") as f:
    json.dump(output, f, indent=2)

print("Saved!")

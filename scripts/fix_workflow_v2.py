#!/usr/bin/env python3
"""
Replace the Code node "Resolver Numero" with an HTTP Request node.
The n8n Code node sandbox might not support async fetch properly.
Instead, use an HTTP Request node to call the LID resolver, then a Code node
to extract the result and format the output.
"""
import json

with open("/tmp/wf_current.json") as f:
    data = json.load(f)

wf = data[0] if isinstance(data, list) else data
nodes = wf.get("nodes", [])
connections = wf.get("connections", {})

# Remove old "Resolver Numero" node
nodes = [n for n in nodes if n.get("name") != "Resolver Numero"]

# Find node positions
enviar_pos = None
limpar_pos = None
for n in nodes:
    if "Enviar" in n.get("name", ""):
        enviar_pos = n["position"]
    if "Limpar" in n.get("name", ""):
        limpar_pos = n["position"]

# Create HTTP Request node to resolve LID
resolver_http_node = {
    "parameters": {
        "method": "GET",
        "url": "=http://172.17.0.1:3847/resolve-lid?lid={{ $('Webhook Evolution API').item.json.body.data.key.remoteJid.replace('@lid', '').replace('@s.whatsapp.net', '') }}",
        "sendHeaders": False,
        "sendBody": False,
        "options": {
            "response": {
                "response": {
                    "responseFormat": "json"
                }
            }
        }
    },
    "id": "resolver-http-node",
    "name": "Resolver LID",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.1,
    "position": [
        enviar_pos[0] - 400 if enviar_pos else 700,
        enviar_pos[1] if enviar_pos else 320
    ]
}

# Create Code node to format the final payload
format_node = {
    "parameters": {
        "jsCode": """// Formatar payload para envio
const resolverData = $('Resolver LID').first().json;
const limparData = $('Limpar Output').first().json;
const webhookData = $('Webhook Evolution API').first().json;

const remoteJid = webhookData.body?.data?.key?.remoteJid || '';
const instance = webhookData.body?.instance || 'FastGram_Bot';

// Se o resolver encontrou o numero, usar ele. Senao, usar o remoteJid limpo
let targetNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@lid', '');
if (resolverData.resolved && resolverData.phone) {
  targetNumber = resolverData.phone;
}

const aiOutput = limparData.output || limparData.text || '';

return [{
  json: {
    targetNumber,
    output: aiOutput,
    instance
  }
}];"""
    },
    "id": "format-payload-node",
    "name": "Formatar Payload",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [
        enviar_pos[0] - 200 if enviar_pos else 900,
        enviar_pos[1] if enviar_pos else 320
    ]
}

nodes.append(resolver_http_node)
nodes.append(format_node)

# Update Enviar Resposta WhatsApp
for n in nodes:
    if n.get("name") == "Enviar Resposta WhatsApp":
        n["parameters"]["url"] = "=https://zap.fastgram.com.br/message/sendText/{{ $json.instance }}"
        n["parameters"]["jsonBody"] = '={{ JSON.stringify({ "number": $json.targetNumber, "textMessage": { "text": $json.output } }) }}'

# Update connections:
# Limpar Output -> Resolver LID -> Formatar Payload -> Enviar Resposta WhatsApp
# Remove old Limpar Output connections to Enviar or Resolver Numero
if "Limpar Output" in connections:
    connections["Limpar Output"]["main"] = [[{"node": "Resolver LID", "type": "main", "index": 0}]]

# Remove old Resolver Numero connections
if "Resolver Numero" in connections:
    del connections["Resolver Numero"]

# Add new connections
connections["Resolver LID"] = {
    "main": [[{"node": "Formatar Payload", "type": "main", "index": 0}]]
}
connections["Formatar Payload"] = {
    "main": [[{"node": "Enviar Resposta WhatsApp", "type": "main", "index": 0}]]
}

wf["nodes"] = nodes
wf["active"] = True

output = [wf] if isinstance(data, list) else wf
with open("/tmp/wf_fixed.json", "w") as f:
    json.dump(output, f, indent=2)

print("Workflow fixed with HTTP Request + Code node approach!")
print(f"Nodes: {[n['name'] for n in nodes]}")
print(f"Chain: Limpar Output -> Resolver LID (HTTP) -> Formatar Payload (Code) -> Enviar Resposta WhatsApp")

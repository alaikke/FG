#!/usr/bin/env python3
"""Fix the n8n workflow to resolve LID before sending messages."""
import json
import sys

with open("/tmp/wf_current.json", "r") as f:
    data = json.load(f)

wf = data[0] if isinstance(data, list) else data
nodes = wf.get("nodes", [])
connections = wf.get("connections", {})

# Find existing nodes
enviar_node = None
limpar_node = None

for n in nodes:
    if "Enviar" in n.get("name", ""):
        enviar_node = n
    if "Limpar" in n.get("name", ""):
        limpar_node = n

source_node_name = "Limpar Output" if limpar_node else "AI Agent"
print(f"Source node: {source_node_name}")
print(f"Enviar node found: {enviar_node is not None}")

# Remove any existing "Resolver Numero" node
nodes = [n for n in nodes if n.get("name") != "Resolver Numero"]

# Create the Resolver Numero Code node
JS_CODE = r"""// Resolver LID para numero real
const webhookData = $('Webhook Evolution API').first().json;
const remoteJid = webhookData.body?.data?.key?.remoteJid || '';
const instance = webhookData.body?.instance || 'FastGram_Bot';

let targetNumber = remoteJid;

if (remoteJid.includes('@lid')) {
  const lidNumber = remoteJid.replace('@lid', '');
  try {
    const response = await fetch('http://127.0.0.1:3847/resolve-lid?lid=' + lidNumber);
    const data = await response.json();
    if (data.resolved && data.phone) {
      targetNumber = data.phone;
    }
  } catch (e) {
    console.log('LID resolver error:', e.message);
  }
} else {
  targetNumber = remoteJid.replace('@s.whatsapp.net', '');
}

const aiOutput = $input.first().json.output || $input.first().json.text || '';

return [{
  json: {
    targetNumber,
    output: aiOutput,
    instance
  }
}];"""

resolver_node = {
    "parameters": {
        "jsCode": JS_CODE
    },
    "id": "resolver-numero-node",
    "name": "Resolver Numero",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [
        enviar_node["position"][0] - 200 if enviar_node else 900,
        enviar_node["position"][1] if enviar_node else 320
    ]
}

nodes.append(resolver_node)

# Update "Enviar Resposta WhatsApp" to use resolved data
if enviar_node:
    enviar_node["parameters"]["url"] = "=http://127.0.0.1:8080/message/sendText/{{ $json.instance }}"
    enviar_node["parameters"]["jsonBody"] = '={{ JSON.stringify({ "number": $json.targetNumber, "textMessage": { "text": $json.output } }) }}'

# Fix connections: source_node -> Resolver Numero -> Enviar Resposta WhatsApp
if source_node_name in connections:
    old_main = connections[source_node_name].get("main", [[]])
    new_main = []
    for output_connections in old_main:
        filtered = [c for c in output_connections if c.get("node") != "Enviar Resposta WhatsApp" and c.get("node") != "Resolver Numero"]
        filtered.append({"node": "Resolver Numero", "type": "main", "index": 0})
        new_main.append(filtered)
    connections[source_node_name]["main"] = new_main

# Remove any direct connection from AI Agent to Enviar
if "AI Agent" in connections and source_node_name != "AI Agent":
    for i, output_list in enumerate(connections["AI Agent"].get("main", [[]])):
        connections["AI Agent"]["main"][i] = [
            c for c in output_list if c.get("node") != "Enviar Resposta WhatsApp"
        ]

# Set connection: Resolver Numero -> Enviar Resposta WhatsApp
connections["Resolver Numero"] = {
    "main": [[{"node": "Enviar Resposta WhatsApp", "type": "main", "index": 0}]]
}

wf["nodes"] = nodes
wf["active"] = True

output = [wf] if isinstance(data, list) else wf
with open("/tmp/wf_fixed.json", "w") as f:
    json.dump(output, f, indent=2)

print("Workflow fixed successfully!")
print(f"Total nodes: {len(nodes)}")
print(f"Node names: {[n['name'] for n in nodes]}")
print(f"Connection chain: {source_node_name} -> Resolver Numero -> Enviar Resposta WhatsApp")

#!/usr/bin/env python3
"""
Simplify: merge Limpar Output + Formatar Payload into a single Code node.
Remove both old nodes and add one "Preparar Resposta" node that:
1. Cleans the AI output (removes thinking/reasoning)
2. Resolves the target number from the LID resolver
3. Formats the final payload for sending
"""
import json

with open("/tmp/wf_current.json") as f:
    data = json.load(f)

wf = data[0] if isinstance(data, list) else data
nodes = wf.get("nodes", [])
connections = wf.get("connections", {})

# Remove old Limpar Output and Formatar Payload
nodes = [n for n in nodes if n.get("name") not in ["Limpar Output", "Formatar Payload"]]

# Find positions
resolver_pos = None
enviar_pos = None
for n in nodes:
    if n.get("name") == "Resolver LID":
        resolver_pos = n["position"]
    if n.get("name") == "Enviar Resposta WhatsApp":
        enviar_pos = n["position"]

# Create unified "Preparar Resposta" node
preparar_node = {
    "parameters": {
        "jsCode": r"""// Preparar Resposta: limpar output + resolver numero + formatar payload
const webhookData = $('Webhook Evolution API').first().json;
const aiRaw = $('AI Agent').first().json.output || '';
const resolverData = $('Resolver LID').first().json;

// === LIMPAR OUTPUT ===
let output = aiRaw;

// Remove <think>...</think> blocks
output = output.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

// Smart split: separate reasoning from response
// The Qwen3 model typically outputs English reasoning then Portuguese response
const hasEnglish = /^[A-Za-z]/.test(output.trim()) && /\b(the|let|need|should|check|user|rules?|tool|first|okay|response|answer|message|according)\b/i.test(output);

if (hasEnglish) {
  // Try to find Portuguese text after the reasoning
  // Split by double newline and filter
  const parts = output.split(/\n\n+/);
  const ptParts = parts.filter(p => {
    const t = p.trim();
    if (!t || t.length < 3) return false;
    return /[àáâãéêíóôõúçÀÁÂÃÉÊÍÓÔÕÚÇ]/.test(t) || 
           /\b(olá|oi|bom|dia|obrigad|pedido|seguidores|preço|ajudar|posso|precisar|sou|como|aqui|custa|reais|comprar|instagram|custo|valor)\b/i.test(t) ||
           /R\$/.test(t) ||
           /[😊🎉✅👋🚀🤖💰]/.test(t);
  });
  
  if (ptParts.length > 0) {
    output = ptParts.join('\n').trim();
  } else {
    // Try single newline split
    const lines = output.split('\n');
    const ptLines = lines.filter(l => {
      const t = l.trim();
      if (!t) return false;
      return /[àáâãéêíóôõúçÀÁÂÃÉÊÍÓÔÕÚÇ]/.test(t) || 
             /\b(olá|oi|seguidores|preço|ajudar|posso|pedido|custa|reais|custo|valor|comprar)\b/i.test(t) ||
             /R\$/.test(t);
    });
    
    if (ptLines.length > 0) {
      output = ptLines.join('\n').trim();
    } else {
      // Extract price if mentioned
      const priceMatch = output.match(/R\$\s*[\d,.]+/);
      if (priceMatch) {
        output = 'O preço de 1000 seguidores é ' + priceMatch[0] + '. Posso te ajudar com mais alguma coisa? 😊';
      } else {
        output = 'Olá! Sou o assistente FastGram. Como posso te ajudar? 😊';
      }
    }
  }
}

// Final cleanup: remove any remaining English at the start
while (/^[A-Z][a-z].*?\.\s/.test(output) && /\b(the|is|are|was|have|need|should|check|user|rule|tool|answer|response|message)\b/i.test(output.split('.')[0])) {
  output = output.replace(/^[^.]*\.\s*/, '').trim();
}

if (!output || output.length < 3) {
  output = 'Olá! Sou o assistente FastGram. Como posso te ajudar? 😊';
}

// === RESOLVER NUMERO ===
const remoteJid = webhookData.body?.data?.key?.remoteJid || '';
const instance = webhookData.body?.instance || 'FastGram_Bot';
let targetNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@lid', '');
if (resolverData.resolved && resolverData.phone) {
  targetNumber = resolverData.phone;
}

return [{
  json: {
    targetNumber,
    output,
    instance
  }
}];"""
    },
    "id": "preparar-resposta-node",
    "name": "Preparar Resposta",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [
        enviar_pos[0] - 200 if enviar_pos else 1000,
        enviar_pos[1] if enviar_pos else 320
    ]
}

nodes.append(preparar_node)

# Fix connections:
# AI Agent -> Resolver LID (HTTP) -> Preparar Resposta -> Enviar Resposta WhatsApp
# Remove old connections
for name in list(connections.keys()):
    if name in ["Limpar Output", "Formatar Payload"]:
        del connections[name]

# AI Agent -> Resolver LID
connections["AI Agent"]["main"] = [[{"node": "Resolver LID", "type": "main", "index": 0}]]

# Resolver LID -> Preparar Resposta
connections["Resolver LID"] = {
    "main": [[{"node": "Preparar Resposta", "type": "main", "index": 0}]]
}

# Preparar Resposta -> Enviar Resposta WhatsApp
connections["Preparar Resposta"] = {
    "main": [[{"node": "Enviar Resposta WhatsApp", "type": "main", "index": 0}]]
}

wf["nodes"] = nodes
wf["active"] = True

output = [wf] if isinstance(data, list) else wf
with open("/tmp/wf_fixed.json", "w") as f:
    json.dump(output, f, indent=2)

print("Workflow simplified!")
print(f"Nodes: {[n['name'] for n in nodes]}")
print("Chain: AI Agent -> Resolver LID -> Preparar Resposta -> Enviar Resposta WhatsApp")

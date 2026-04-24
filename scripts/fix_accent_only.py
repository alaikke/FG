#!/usr/bin/env python3
"""Fix: remove R$ from filter, use ONLY accented characters."""
import json

with open("/tmp/wf_current.json") as f:
    data = json.load(f)

wf = data[0] if isinstance(data, list) else data

# The bug: R$ appears in BOTH English reasoning and Portuguese response
# Fix: only use accented characters as the filter
FIXED_CODE = r"""// Preparar Resposta: limpar output + resolver numero
const webhookData = $('Webhook Evolution API').first().json;
const aiRaw = $('AI Agent').first().json.output || '';
const resolverData = $('Resolver LID').first().json;

// === LIMPAR OUTPUT ===
let output = aiRaw;

// Remove <think>...</think> blocks
output = output.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

// FILTER: Keep ONLY lines with Portuguese accented characters
// Portuguese always has àáâãéêíóôõúç, English reasoning never does
const lines = output.split('\n');
const ptLines = lines.filter(l => {
  const t = l.trim();
  if (!t) return false;
  return /[\u00C0-\u00FF]/.test(t);
});

if (ptLines.length > 0) {
  output = ptLines.join('\n').trim();
} else {
  // Fallback: no accented lines found
  const priceMatch = aiRaw.match(/R\$\s*[\d,.]+/);
  if (priceMatch) {
    output = 'O preço de 1000 seguidores é ' + priceMatch[0] + '. Posso ajudar com mais alguma coisa?';
  } else {
    output = 'Olá! Sou o assistente FastGram. Como posso te ajudar?';
  }
}

// === RESOLVER NUMERO ===
const remoteJid = webhookData.body?.data?.key?.remoteJid || '';
const instance = webhookData.body?.instance || 'FastGram_Bot';
let targetNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@lid', '');
if (resolverData.resolved && resolverData.phone) {
  targetNumber = resolverData.phone;
}

return [{ json: { targetNumber, output, instance } }];"""

for n in wf["nodes"]:
    if n.get("name") == "Preparar Resposta":
        n["parameters"]["jsCode"] = FIXED_CODE
        print("Fixed: now uses ONLY accented chars, no R$ in filter")

output = [wf] if isinstance(data, list) else wf
with open("/tmp/wf_fixed.json", "w") as f:
    json.dump(output, f, indent=2)
print("Saved!")

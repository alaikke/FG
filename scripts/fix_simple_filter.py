#!/usr/bin/env python3
"""
Ultra-simple fix: filter by accented characters.
Portuguese text ALWAYS contains àáâãéêíóôõúç, English reasoning NEVER does.
"""
import json

with open("/tmp/wf_current.json") as f:
    data = json.load(f)

wf = data[0] if isinstance(data, list) else data

SIMPLE_FILTER = r"""// Preparar Resposta: limpar output + resolver numero + formatar payload
const webhookData = $('Webhook Evolution API').first().json;
const aiRaw = $('AI Agent').first().json.output || '';
const resolverData = $('Resolver LID').first().json;

// === LIMPAR OUTPUT ===
let output = aiRaw;

// Remove <think>...</think> blocks
output = output.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

// SIMPLE FILTER: Portuguese has accented chars, English doesn't
const lines = output.split('\n');
const ptLines = lines.filter(l => {
  const t = l.trim();
  if (!t) return false;
  // Line has Portuguese accented characters OR R$ price
  return /[àáâãéêíóôõúçÀÁÂÃÉÊÍÓÔÕÚÇ]/.test(t) || /R\$/.test(t);
});

if (ptLines.length > 0) {
  output = ptLines.join('\n').trim();
} else {
  // No Portuguese lines found - try to extract price
  const priceMatch = aiRaw.match(/R\$\s*[\d,.]+/);
  if (priceMatch) {
    output = 'O preço de 1000 seguidores é ' + priceMatch[0] + '. Posso ajudar com mais alguma coisa? 😊';
  } else {
    output = 'Olá! Sou o assistente FastGram. Como posso te ajudar? 😊';
  }
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

for n in wf["nodes"]:
    if n.get("name") == "Preparar Resposta":
        n["parameters"]["jsCode"] = SIMPLE_FILTER
        print(f"Updated Preparar Resposta with ultra-simple accent-based filter")

output = [wf] if isinstance(data, list) else wf
with open("/tmp/wf_fixed.json", "w") as f:
    json.dump(output, f, indent=2)

print("Saved!")

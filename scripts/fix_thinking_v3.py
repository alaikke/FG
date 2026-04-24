#!/usr/bin/env python3
"""
Comprehensive fix for the Qwen3 thinking output issue.
Two changes:
1. Add /no_think to the user prompt in the AI Agent node
2. Completely rewrite Limpar Output to handle continuous reasoning blocks
"""
import json

with open("/tmp/wf_current.json") as f:
    data = json.load(f)

wf = data[0] if isinstance(data, list) else data

for n in wf["nodes"]:
    # Fix 1: Add /no_think to the user message in AI Agent
    if n["name"] == "AI Agent":
        old_text = n["parameters"].get("text", "")
        # Append /no_think at the end if not already there
        if "/no_think" not in old_text:
            n["parameters"]["text"] = old_text + "\n\n/no_think"
            print(f"Added /no_think to AI Agent user prompt")
        
        # Also strengthen the system prompt
        opts = n["parameters"].get("options", {})
        old_sys = opts.get("systemMessage", "")
        if "NUNCA" not in old_sys:
            new_sys = """Você é o assistente da FastGram, uma plataforma de compra de seguidores para Instagram.

REGRAS OBRIGATÓRIAS:
1. Responda SEMPRE em português brasileiro, de forma curta e educada.
2. NUNCA escreva em inglês. NUNCA escreva seus pensamentos ou raciocínio.
3. Responda APENAS com a resposta final para o cliente. Sem explicações internas.
4. Se o cliente perguntar sobre pedido e fornecer um ID, use a ferramenta ConsultarPedido.
5. Se o cliente perguntar preços: use a ferramenta ConsultarPrecos. Se não puder usar a ferramenta agora, o preço padrão é 1.000 seguidores por R$39,90.
6. Não invente informações. Se não souber, peça mais detalhes.
7. Máximo 2 frases por resposta. Seja direto.

/no_think"""
            opts["systemMessage"] = new_sys
            n["parameters"]["options"] = opts
            print(f"Updated system prompt with stronger instructions")
    
    # Fix 2: Completely rewrite Limpar Output
    if "Limpar" in n.get("name", ""):
        n["parameters"]["jsCode"] = r"""// Limpar output do Qwen3 - remover raciocínio/thinking
let output = $input.first().json.output || '';

// 1. Remove <think>...</think> blocks
output = output.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

// 2. Smart detection: if output contains English reasoning, extract Portuguese only
const hasEnglishReasoning = /^(okay|ok|let me|the user|first|well|alright|hmm|i need|i should|looking|wait|so,|now,|checking|based on|according)/i.test(output.trim());

if (hasEnglishReasoning) {
  // Strategy A: Look for Portuguese text after double newline
  const parts = output.split(/\n\n+/);
  const ptParts = parts.filter(p => {
    const t = p.trim();
    if (!t || t.length < 3) return false;
    // Has Portuguese special chars or common Portuguese words
    return /[àáâãéêíóôõúçÀÁÂÃÉÊÍÓÔÕÚÇ]/.test(t) || 
           /\b(olá|oi|bom|dia|obrigad|pedido|seguidores|preço|ajudar|posso|precisar|sou|como|aqui|custa|reais|comprar|instagram)\b/i.test(t) ||
           /R\$/.test(t) ||
           /[😊🎉✅👋🚀🤖]/.test(t);
  });
  
  if (ptParts.length > 0) {
    output = ptParts.join('\n').trim();
  } else {
    // Strategy B: Try to find Portuguese sentences anywhere in the text
    const sentences = output.split(/[.!?]+/);
    const ptSentences = sentences.filter(s => {
      const t = s.trim();
      return t.length > 5 && (
        /[àáâãéêíóôõúçÀÁÂÃÉÊÍÓÔÕÚÇ]/.test(t) ||
        /\b(olá|oi|seguidores|preço|ajudar|posso|pedido|custa|reais|comprar)\b/i.test(t) ||
        /R\$/.test(t)
      );
    });
    
    if (ptSentences.length > 0) {
      output = ptSentences.join('. ').trim();
      if (!output.endsWith('.') && !output.endsWith('!') && !output.endsWith('?')) {
        output += '.';
      }
    } else {
      // Strategy C: Extract price mention or key info
      const priceMatch = output.match(/R\$\s*[\d,.]+/);
      if (priceMatch) {
        output = `O preço é de ${priceMatch[0]} para 1000 seguidores. Posso te ajudar com mais alguma coisa? 😊`;
      } else {
        // Final fallback
        output = 'Olá! Sou o assistente FastGram. Como posso te ajudar? 😊';
      }
    }
  }
}

// 3. Final cleanup - remove any remaining English sentences at the beginning
output = output.replace(/^[A-Z][a-z].*?\.\s*/g, function(match) {
  // Only remove if it looks like English
  if (/\b(the|is|are|was|were|have|has|had|will|would|could|should|can|may|might|must|shall|need|want|user|message|check|rules?|tool|response|answer)\b/i.test(match)) {
    return '';
  }
  return match;
}).trim();

// 4. Ensure we have something
if (!output || output.length < 3) {
  output = 'Olá! Sou o assistente FastGram. Como posso te ajudar? 😊';
}

return [{ json: { output } }];"""
        print(f"Updated Limpar Output with comprehensive filter")

output = [wf] if isinstance(data, list) else wf
with open("/tmp/wf_fixed.json", "w") as f:
    json.dump(output, f, indent=2)

print("All fixes applied!")

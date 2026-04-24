#!/usr/bin/env python3
"""Fix the Limpar Output code to better filter Ollama thinking output."""
import json

with open("/tmp/wf_current.json") as f:
    data = json.load(f)

wf = data[0] if isinstance(data, list) else data

NEW_CLEAN_CODE = r"""// Clean AI Agent output - remove thinking tags and internal reasoning
let output = $input.first().json.output || '';

// Remove <think>...</think> blocks
output = output.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

// Split into lines and filter reasoning
const lines = output.split('\n');
const cleanLines = lines.filter(line => {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed) return false;
    
    // Skip English reasoning patterns
    const reasoningPrefixes = [
        'okay,', 'ok,', 'let me', 'the user', 'i need to', 'i should',
        'looking at', 'since ', 'now,', 'so,', 'hmm', 'first,', 'first ',
        'wait,', 'alright,', 'well,', 'the message', 'the client',
        'they ', 'this is', 'i\'ll', 'i will', 'based on', 'according to',
        'the phone', 'the customer', 'checking', 'let\'s', 'i see',
        'the assistant', 'i can', 'i\'m ', 'here\'s', 'to respond',
        'my response', 'the question', 'the request', 'the system',
        'in this case', 'the rules', 'the tool'
    ];
    
    for (const prefix of reasoningPrefixes) {
        if (trimmed.startsWith(prefix)) return false;
    }
    
    // Skip lines that look like meta-commentary (English sentences about what to do)
    if (/^[A-Z][a-z].*\b(user|message|response|tool|check|need|should|would|could)\b/.test(line.trim())) {
        return false;
    }
    
    return true;
});

output = cleanLines.join('\n').trim();

// If there are mixed lines, try to find the Portuguese response
if (output.length < 5 || /^[A-Za-z]/.test(output)) {
    // Try to extract just the Portuguese text (lines with Portuguese characters/words)
    const ptLines = lines.filter(l => {
        const t = l.trim();
        if (!t) return false;
        // Portuguese indicators
        return /[àáâãéêíóôõúçÀÁÂÃÉÊÍÓÔÕÚÇ]/.test(t) || 
               /\b(olá|oi|bom|dia|obrigad|pedido|seguidores|preço|ajudar|posso|precisar|dizer|sou|como|aqui)\b/i.test(t) ||
               /[😊🎉✅👋🚀]/.test(t);
    });
    
    if (ptLines.length > 0) {
        output = ptLines.join('\n').trim();
    }
}

// Final fallback
if (!output || output.length < 3) {
    output = 'Olá! Sou o assistente FastGram. Como posso te ajudar? 😊';
}

return [{ json: { output } }];"""

for n in wf["nodes"]:
    if "Limpar" in n.get("name", ""):
        n["parameters"]["jsCode"] = NEW_CLEAN_CODE
        print(f"Updated {n['name']} with improved filter")

output = [wf] if isinstance(data, list) else wf
with open("/tmp/wf_fixed.json", "w") as f:
    json.dump(output, f, indent=2)

print("Saved!")

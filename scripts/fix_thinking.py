import json

with open('/tmp/wf_current.json', 'r') as f:
    data = json.load(f)

wf = data[0]

for n in wf['nodes']:
    # Fix AI Agent system prompt - add /no_think instruction
    if n['name'] == 'AI Agent':
        old_system = n['parameters']['options']['systemMessage']
        # Add /no_think and force Portuguese
        new_system = (
            "Voce eh o assistente da FastGram, plataforma de compra de seguidores para Instagram.\n"
            "Regras:\n"
            "1. Responda SEMPRE em portugues brasileiro, de forma curta e educada.\n"
            "2. Se o cliente perguntar sobre pedido e fornecer um ID, use a ferramenta ConsultarPedido.\n"
            "3. Se o cliente perguntar precos: use a ferramenta ConsultarPrecos. Se nao puder usar a ferramenta agora, o preco padrao eh 1.000 seguidores por R$39,90.\n"
            "4. Nao invente informacoes. Se nao souber, peca mais detalhes.\n"
            "5. NUNCA escreva seus pensamentos ou raciocinio. Responda APENAS a mensagem final para o cliente.\n"
            "6. NUNCA use ingles. Tudo em portugues.\n"
            "/no_think"
        )
        n['parameters']['options']['systemMessage'] = new_system
        print(f"OLD system prompt: {old_system[:100]}...")
        print(f"NEW system prompt: {new_system[:100]}...")
    
    # Fix Ollama Chat Model - disable thinking via options
    if n['name'] == 'Ollama Chat Model':
        # Add think: false to options
        if 'options' not in n['parameters']:
            n['parameters']['options'] = {}
        # Add raw mode or numPredict to prevent thinking
        n['parameters']['options']['keepAlive'] = '10m'
        n['parameters']['options']['temperature'] = 0.4
        n['parameters']['options']['numCtx'] = 2048
        print(f"Ollama options updated: {n['parameters']['options']}")

# Also check if we need to add a Code node to strip <think> tags
# Add a function node between AI Agent and Enviar Resposta WhatsApp
# to clean the output

# Find the existing connections
connections = wf.get('connections', {})

# Create a Code node to clean output
code_node = {
    "parameters": {
        "jsCode": """
// Clean AI Agent output - remove thinking tags and internal reasoning
let output = $input.first().json.output || '';

// Remove <think>...</think> blocks
output = output.replace(/<think>[\\s\\S]*?<\\/think>/g, '').trim();

// Remove lines that start with reasoning patterns (English thinking)
const lines = output.split('\\n');
const cleanLines = lines.filter(line => {
    const trimmed = line.trim().toLowerCase();
    // Skip lines that are clearly internal reasoning
    if (trimmed.startsWith('okay,')) return false;
    if (trimmed.startsWith('let me')) return false;
    if (trimmed.startsWith('the user')) return false;
    if (trimmed.startsWith('i need to')) return false;
    if (trimmed.startsWith('i should')) return false;
    if (trimmed.startsWith('looking at')) return false;
    if (trimmed.startsWith('since ')) return false;
    if (trimmed.startsWith('now,')) return false;
    if (trimmed.startsWith('so,')) return false;
    if (trimmed.startsWith('hmm')) return false;
    return true;
});

output = cleanLines.join('\\n').trim();

// If everything was filtered, use a fallback
if (!output || output.length < 5) {
    output = 'Olá! Sou o assistente FastGram. Como posso te ajudar?';
}

return [{ json: { output } }];
"""
    },
    "id": "clean-output-node",
    "name": "Limpar Output",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [860, 320]
}

# Check if clean node already exists
clean_exists = any(n['name'] == 'Limpar Output' for n in wf['nodes'])

if not clean_exists:
    # Add the node
    wf['nodes'].append(code_node)
    
    # Update connections: AI Agent -> Limpar Output -> Enviar Resposta WhatsApp
    # Current: AI Agent -> Enviar Resposta WhatsApp
    # New: AI Agent -> Limpar Output -> Enviar Resposta WhatsApp
    
    if 'AI Agent' in connections:
        # Replace connection from AI Agent
        connections['AI Agent']['main'][0] = [
            {"node": "Limpar Output", "type": "main", "index": 0}
        ]
    
    connections['Limpar Output'] = {
        "main": [
            [{"node": "Enviar Resposta WhatsApp", "type": "main", "index": 0}]
        ]
    }
    
    # Move Enviar Resposta WhatsApp to the right
    for n in wf['nodes']:
        if n['name'] == 'Enviar Resposta WhatsApp':
            n['position'] = [1100, 320]
    
    print("Added 'Limpar Output' code node between AI Agent and Enviar Resposta WhatsApp")
else:
    # Update existing node
    for n in wf['nodes']:
        if n['name'] == 'Limpar Output':
            n['parameters'] = code_node['parameters']
    print("Updated existing 'Limpar Output' node")

wf['connections'] = connections

with open('/tmp/wf_fixed.json', 'w') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("\nWorkflow saved to /tmp/wf_fixed.json")

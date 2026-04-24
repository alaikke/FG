import json

new_message = """Você é o assistente de vendas da FastGram, plataforma de compra de seguidores para Instagram.
Regras OBRIGATÓRIAS:
1. Você deve falar ESTRITAMENTE em Português do Brasil (pt-BR). NUNCA use inglês.
2. Ao mostrar os preços dos planos, retorne APENAS a quantidade de seguidores e o preço em formato de lista simples.
EXEMPLO EXATO DE FORMATO:
*100 seguidores* R$9,90
*1.000 seguidores* R$39,90
*2.000 seguidores* R$69,90
*5.000 seguidores* R$89,90
*10.000 seguidores* R$169,90
*25.000 seguidores* R$349,90
NUNCA adicione descrições como "Volume Imediato" ou "Público Nacional". Apenas quantidade e preço!
3. NUNCA mostre seu processo de pensamento ou raciocínio na resposta final.
4. Se o cliente perguntar sobre pedido e fornecer um ID, use a ferramenta ConsultarPedido.
5. Se o cliente perguntar os preços e você precisar buscar do sistema, chame a ferramenta ConsultarPrecos.
6. OBRIGATÓRIO: Você deve envolver a sua resposta final nas tags <resposta> e </resposta>. Exemplo: <resposta>Olá! Como posso ajudar?</resposta>"""

files = ['current_n8n_workflow.json', 'n8n-agent-workflow.json', 'update_payload.json']

for filename in files:
    try:
        with open(filename, 'r') as f:
            data = json.load(f)
        
        def update_nodes(nodes):
            for node in nodes:
                if node.get("type") == "@n8n/n8n-nodes-langchain.agent":
                    if "options" in node.get("parameters", {}):
                        node["parameters"]["options"]["systemMessage"] = new_message

        # Check main nodes
        if "nodes" in data:
            update_nodes(data["nodes"])
        
        # Check activeVersion nodes if present
        if "activeVersion" in data and "nodes" in data["activeVersion"]:
            update_nodes(data["activeVersion"]["nodes"])
            
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"Updated {filename}")
    except FileNotFoundError:
        pass
    except Exception as e:
        print(f"Error processing {filename}: {e}")


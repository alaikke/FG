import json

def update_regex(filename):
    try:
        with open(filename, 'r') as f:
            data = json.load(f)
        
        def update_nodes(nodes):
            for node in nodes:
                if node.get("name") == "Enviar Resposta WhatsApp" and node.get("type") == "n8n-nodes-base.httpRequest":
                    old_body = node["parameters"].get("jsonBody", "")
                    # Replace the regex part with the safer split/pop approach
                    new_body = "={{ JSON.stringify({ \"number\": $(\"Webhook Evolution API\").item.json.body.data.participant || $(\"Webhook Evolution API\").item.json.body.data.key.remoteJid, \"textMessage\": { \"text\": ($json.output.split('<resposta>').pop().replace('</resposta>', '').trim()) } }) }}"
                    node["parameters"]["jsonBody"] = new_body

        if "nodes" in data:
            update_nodes(data["nodes"])
        
        if "activeVersion" in data and "nodes" in data["activeVersion"]:
            update_nodes(data["activeVersion"]["nodes"])
            
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"Updated {filename}")
    except Exception as e:
        print(f"Error processing {filename}: {e}")

update_regex('current_n8n_workflow.json')
update_regex('n8n-agent-workflow.json')
update_regex('update_payload.json')

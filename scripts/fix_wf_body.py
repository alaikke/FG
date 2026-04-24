import json

with open('/tmp/wf_current.json', 'r') as f:
    data = json.load(f)

wf = data[0]

for n in wf['nodes']:
    if n['name'] == 'Enviar Resposta WhatsApp':
        # Usar sender em vez de data.key.remoteJid (que pode ser LID)
        webhook_ref = "$('Webhook Evolution API')"
        n['parameters']['jsonBody'] = '={{ JSON.stringify({ "number": ' + webhook_ref + '.item.json.body.sender, "textMessage": { "text": $json.output } }) }}'
        print(f'JSON body atualizado: usa sender em vez de data.key.remoteJid')
        print(f'Novo body: {n["parameters"]["jsonBody"]}')

# Também corrigir o system prompt do AI Agent para usar sender
for n in wf['nodes']:
    if n['name'] == 'AI Agent':
        old_prompt = n['parameters'].get('text', '')
        # Trocar data.key.remoteJid por sender no text do prompt
        if 'data.key.remoteJid' in old_prompt:
            n['parameters']['text'] = old_prompt.replace(
                '$json.body.data.key.remoteJid',
                '$json.body.sender'
            )
            print('Prompt do AI Agent atualizado para usar sender')

# Corrigir sessionKey na memória para usar sender
for n in wf['nodes']:
    if n['name'] == 'Window Buffer Memory':
        old_key = n['parameters'].get('sessionKey', '')
        if 'remoteJid' in old_key:
            n['parameters']['sessionKey'] = "={{ $('Webhook Evolution API').item.json.body.sender }}"
            print(f'Session key atualizada para usar sender')

with open('/tmp/wf_current.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False)
print('\nWorkflow salvo!')

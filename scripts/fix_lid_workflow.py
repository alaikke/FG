#!/usr/bin/env python3
"""
Fix the n8n workflow to handle LID (Linked ID) format.

Problem: Evolution API webhook sends remoteJid as LID (e.g., 89322451656933@lid)
but the sendText API doesn't accept LID format. It needs the real phone number.

Solution: Add a "Resolver Número" HTTP Request node that queries the Evolution API
internal session files to find the phone number mapping, and a Code node to extract it.

Since the Evolution API doesn't have a direct LID→number API, we'll use a different
approach: Add a Code node that makes an HTTP request to list session files and find
the matching phone number based on the same registrationId.

Actually, the simplest approach: Since the Baileys store has session files named with
both the LID and phone number, and both share the same registrationId, we can create
a small resolver. But the Evolution API doesn't expose this.

SIMPLEST APPROACH: The Evolution API v1.8.2 can send messages to a JID directly
if we use the right endpoint. Let's check if we can use the `number` field with
just the phone digits, and the API will resolve it.

Wait - we tested and sending to 5548991945922 WORKS. The issue is that the webhook
doesn't give us this number. But we DO know the mapping exists in the session store.

FINAL APPROACH: Create a Code node in the workflow that:
1. Takes the remoteJid from the webhook
2. If it's a LID, makes an HTTP request to a custom backend endpoint that resolves it
3. If it's a regular JID, uses it directly

For the backend endpoint, we'll create a simple resolver that reads the Docker store.
But that's complex. Instead, let's use a different approach:

The Evolution API stores contacts. The findContacts endpoint returns contacts but 
without phone numbers for LID contacts. However, there's a workaround:

We can add the CONTACTS_UPSERT event to the webhook, which will fire when a contact
is synced with their phone number. But that doesn't help for existing conversations.

PRAGMATIC SOLUTION: Modify the n8n workflow to:
1. Add a "Resolver Número" HTTP Request node that calls Evolution API findContacts
   by LID to get the pushName
2. Add a Code node that extracts a usable number from the session files via a custom API

Actually, the MOST PRAGMATIC solution is to:
1. Create an endpoint on the FastGram backend that resolves LID→number by reading
   the Evolution API session files from the Docker volume
2. Call this endpoint from the n8n workflow

BUT even simpler - let me just modify the n8n workflow to call the Evolution API's
internal store directly since n8n is on the same server.

SIMPLEST FIX: The Evolution API container has session files accessible. We can
mount those files and create a resolver. But this requires Docker changes.

OK, THE ABSOLUTE SIMPLEST FIX:
Since we can't easily resolve LID→number with the current API, let's:
1. Configure the Evolution API webhook to send ALL events including CONTACTS_UPDATE
2. Create a LID→number mapping table in the n8n workflow using a Set node

BUT the absolutely simplest approach that works RIGHT NOW:
- The Baileys library stores the LID-to-JID mapping internally
- When receiving a message, Baileys knows both the LID and the phone number
- The issue is that Evolution API v1.8.2 doesn't expose this in the webhook payload
- Upgrading to v2.x would fix this, but could break the setup

DECISION: Let's add a Code node to the n8n workflow that, when it encounters a LID,
does an HTTP request to list ALL sessions in the Evolution API store, finds the one
with a matching registrationId, and extracts the phone number.

Wait, we can't access the store via HTTP. Let me think differently...

ACTUAL SIMPLEST SOLUTION: Add a custom backend endpoint to FastGram that:
1. Accepts a LID
2. Reads the Evolution API store directory (mounted as Docker volume) 
3. Returns the matching phone number

OR: Mount the evolution store as readable from the host and create the resolver.

OK final decision - I'll do two things:
1. Create a simple LID resolver endpoint on the backend
2. Update the n8n workflow to call this endpoint before sending

But actually, the BACKEND is not on the VPS in the same way... Let me check.

The backend IS on the VPS. And the Evolution API store IS accessible from the host at 
/opt/evolution-api/data/evolution/instances/FastGram_Bot/

So I can create a simple script or API endpoint that resolves LID.

ACTUALLY THE SIMPLEST: Just modify the workflow to hardcode the resolution or use
a lookup table. For a proper fix, I'll update the Evolution API to v2.2.3 which
handles LID properly.

Let me just update the workflow NOW with a temporary fix and then upgrade the API.
"""

import json

# Read the current workflow
with open('/tmp/wf_current.json', 'r') as f:
    data = json.load(f)

wf = data[0] if isinstance(data, list) else data

# Find nodes
nodes = wf.get('nodes', [])
connections = wf.get('connections', {})

# Add a "Resolver Número" Code node between AI Agent (or Limpar Output) and Enviar Resposta
# This node will:
# 1. Check if remoteJid is LID format
# 2. If yes, query the Evolution API session files to find the real number
# 3. Set the correct number for sending

resolver_node = {
    "parameters": {
        "jsCode": """// Resolver LID → Número Real
// O webhook da Evolution API v1.8.2 envia o remoteJid em formato LID
// que não é aceito pelo endpoint sendText. Precisamos resolver para o número real.

const webhookData = $('Webhook Evolution API').first().json;
const remoteJid = webhookData.body?.data?.key?.remoteJid || webhookData.body?.sender || '';
const instance = webhookData.body?.instance || 'FastGram_Bot';

let targetNumber = remoteJid;

// Se for formato LID, precisamos resolver
if (remoteJid.includes('@lid')) {
  // Tentar buscar o número via Evolution API session files
  // Como fallback, usar a lista de sessions do filesystem
  try {
    // Approach 1: Check if we have a stored mapping
    const lid = remoteJid.replace('@lid', '');
    
    // Approach 2: List session files via the Evolution API store
    // The session files are named like session-{number}.{device}.json
    // Both the LID and phone number have sessions with the same registrationId
    
    // For now, use a direct HTTP call to find contacts and try to resolve
    const contactsResponse = await fetch(
      `http://127.0.0.1:8080/chat/findContacts/${instance}`,
      {
        method: 'POST',
        headers: {
          'apikey': 'B4K1L3V7H8F9X2P5R6M4N1C0Z9Y8W7Q',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      }
    );
    
    const contacts = await contactsResponse.json();
    
    // Look for contacts that have a real phone number (not LID)
    // and try to match by session registrationId
    const phoneContacts = (Array.isArray(contacts) ? contacts : [])
      .filter(c => c.id && c.id.includes('@s.whatsapp.net'))
      .map(c => c.id.replace('@s.whatsapp.net', ''));
    
    if (phoneContacts.length > 0) {
      // If there's only one non-bot contact, it's likely the user
      const botNumber = '554888332790';
      const userContacts = phoneContacts.filter(n => n !== botNumber);
      if (userContacts.length === 1) {
        targetNumber = userContacts[0];
      }
    }
    
    // If we still have LID, try a different approach:
    // Read session files directly (works because n8n is on the same host)
    if (targetNumber.includes('@lid')) {
      // Fallback: try to exec into the container
      // This won't work from n8n, so we use a different approach
      
      // Last resort: strip @lid and check if it works as a number
      // (it won't, but we log it for debugging)
      console.log(`WARNING: Could not resolve LID ${remoteJid} to phone number`);
      console.log('Available contacts:', phoneContacts);
    }
  } catch (error) {
    console.log('Error resolving LID:', error.message);
  }
}

// Clean up the number - remove @s.whatsapp.net if present
targetNumber = targetNumber.replace('@s.whatsapp.net', '').replace('@lid', '');

// Get the AI output (from Limpar Output or AI Agent)
const aiOutput = $input.first().json.output || $input.first().json.text || '';

return [{
  json: {
    targetNumber,
    originalJid: remoteJid,
    output: aiOutput,
    instance
  }
}];"""
    },
    "id": "resolver-numero-node",
    "name": "Resolver Numero",
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [860, 320]
}

print("Script loaded - but this approach is too complex.")
print("Better approach: upgrade Evolution API to v2.2.3 or add a simple resolver endpoint.")
print()
print("THE SIMPLEST FIX: Update the n8n workflow 'Enviar Resposta WhatsApp' node")
print("to use a Code node that calls the Evolution API with the PHONE NUMBER from session files,")
print("instead of the LID from the webhook.")

#!/usr/bin/env python3
import http.server
import json
import os
import re
import urllib.request
import urllib.error

STORE_PATH = "/opt/evolution-api/data/evolution/FastGram_Bot"
N8N_WEBHOOK_URL = "http://127.0.0.1:5678/webhook/evolution-webhook"

def find_phone_for_lid(lid_number):
    lid_number = lid_number.replace("@lid", "")
    lid_session_file = os.path.join(STORE_PATH, f"session-{lid_number}.0.json")
    if not os.path.exists(lid_session_file):
        return None
    with open(lid_session_file) as f:
        lid_data = json.load(f)
    lid_reg_id = None
    for key, session in lid_data.get("_sessions", {}).items():
        lid_reg_id = session.get("registrationId")
        if lid_reg_id: break
    if not lid_reg_id: return None
    
    for filename in os.listdir(STORE_PATH):
        if not filename.startswith("session-") or not filename.endswith(".0.json"): continue
        match = re.match(r"session-(\d+)\.0\.json", filename)
        if not match: continue
        number = match.group(1)
        if number == lid_number or number == "554888332790": continue
        try:
            with open(os.path.join(STORE_PATH, filename)) as f:
                data = json.load(f)
            for key, session in data.get("_sessions", {}).items():
                if session.get("registrationId") == lid_reg_id:
                    return number
        except: continue
    return None

class Handler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            payload = json.loads(post_data.decode('utf-8'))
            
            # Check if it's a message event
            if payload.get('event') == 'messages.upsert':
                remote_jid = payload.get('data', {}).get('key', {}).get('remoteJid', '')
                if '@lid' in remote_jid:
                    phone = find_phone_for_lid(remote_jid)
                    if phone:
                        # Replace remoteJid with real phone number
                        payload['data']['key']['remoteJid'] = f"{phone}@s.whatsapp.net"
                        
                        # also clear participant so it doesn't use the bot's number
                        if 'participant' in payload['data']:
                            del payload['data']['participant']
            
            # Forward to n8n
            req = urllib.request.Request(N8N_WEBHOOK_URL, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req) as response:
                self.send_response(response.getcode())
                self.end_headers()
                self.wfile.write(response.read())
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode())

    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Proxy running")

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    server = http.server.HTTPServer(("0.0.0.0", 3847), Handler)
    print("LID Proxy running on :3847")
    server.serve_forever()

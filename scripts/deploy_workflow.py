import json
import urllib.request
import ssl

api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNzU4YmUyMy01Njk4LTRhNjQtYWY0NC1iMmIwNWIyODVkMjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNjFiZjBiOTYtYTYyNC00YjM0LTk3N2EtNmZiNDY1MjMwMTljIiwiaWF0IjoxNzc2OTkzNzI3fQ.TmXxGFRQZtP78p6w3KDt4soeY9cN2XQhhmHFuuY5P9Y"
workflow_id = "5uGFiqnClDRQi935"
url = f"https://ene8ene.fastgram.com.br/api/v1/workflows/{workflow_id}"

with open("current_n8n_workflow.json", "r") as f:
    workflow_data = json.load(f)

allowed_fields = ["name", "nodes", "connections", "settings"]
payload = {k: v for k, v in workflow_data.items() if k in allowed_fields}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "X-N8N-API-KEY": api_key,
        "Content-Type": "application/json"
    },
    method="PUT"
)

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        result = response.read().decode("utf-8")
        print("Success:", result[:200])
except urllib.error.HTTPError as e:
    print("Error:", e.code, e.read().decode("utf-8")[:200])
except Exception as e:
    print("Exception:", str(e)[:200])

import urllib.request
import json
import ssl

api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNzU4YmUyMy01Njk4LTRhNjQtYWY0NC1iMmIwNWIyODVkMjMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNjFiZjBiOTYtYTYyNC00YjM0LTk3N2EtNmZiNDY1MjMwMTljIiwiaWF0IjoxNzc2OTkzNzI3fQ.TmXxGFRQZtP78p6w3KDt4soeY9cN2XQhhmHFuuY5P9Y"
workflow_id = "5uGFiqnClDRQi935"
url = f"https://ene8ene.fastgram.com.br/api/v1/workflows/{workflow_id}"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(url, headers={"X-N8N-API-KEY": api_key, "Accept": "application/json"})

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        data = json.loads(response.read().decode("utf-8"))
        print(json.dumps(data.get("nodes", []), indent=2))
except Exception as e:
    print("Exception:", str(e))

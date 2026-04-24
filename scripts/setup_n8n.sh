#!/bin/bash
set -e

echo "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker..."
    apt-get update
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

echo "Verificando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    # docker-compose is now a plugin: docker compose, but let's link it
    apt-get install -y docker-compose-plugin || true
fi

echo "Criando diretórios para o n8n..."
mkdir -p /opt/n8n/.n8n
chown -R 1000:1000 /opt/n8n

echo "Criando docker-compose.yml..."
cat << 'EOF' > /opt/n8n/docker-compose.yml
version: '3.8'

volumes:
  n8n_data:

services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: always
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      - N8N_HOST=ene8ene.fastgram.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://ene8ene.fastgram.com/
      - GENERIC_TIMEZONE=America/Sao_Paulo
    volumes:
      - n8n_data:/home/node/.n8n
EOF

echo "Iniciando contêiner do n8n..."
cd /opt/n8n
docker compose up -d || docker-compose up -d

echo "Configurando Nginx..."
cat << 'EOF' > /etc/nginx/sites-available/ene8ene.fastgram.com
server {
    listen 80;
    server_name ene8ene.fastgram.com;

    location / {
        proxy_pass http://127.0.0.1:5678;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/ene8ene.fastgram.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "n8n Setup Finalizado!"

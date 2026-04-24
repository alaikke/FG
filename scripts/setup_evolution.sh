#!/bin/bash
set -e

echo "Criando diretórios para Evolution API..."
mkdir -p /opt/evolution-api
cd /opt/evolution-api

echo "Criando docker-compose.yml..."
cat << 'EOF' > docker-compose.yml
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:v2.2.1
    restart: always
    ports:
      - "127.0.0.1:8080:8080"
    environment:
      - SERVER_URL=https://zap.fastgram.com.br
      - CORS_ORIGIN=*
      - CORS_METHODS=GET,POST,PUT,DELETE
      - CORS_CREDENTIALS=true
      - DEL_INSTANCE=false
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://postgres:evolution@postgres:5432/evolution?schema=public
      - DATABASE_CONNECTION_CLIENT_NAME=evolution_api
      - REDIS_URI=redis://redis:6379/0
      - REDIS_PREFIX_KEY=evolution
      - RABBITMQ_ENABLED=false
      - WEBSOCKET_ENABLED=false
      - SERVER_TYPE=http
      - GLOBAL_API_KEY=B4K1L3V7H8F9X2P5R6M4N1C0Z9Y8W7Q
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=B4K1L3V7H8F9X2P5R6M4N1C0Z9Y8W7Q
      - AUTHENTICATION_EXPOSE_IN_ENV=true
      - QOS=1
      - LOG_LEVEL=ERROR,WARN,DEBUG,INFO,LOG,VERBOSE,DARK,WEBHOOKS
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=evolution
      - POSTGRES_DB=evolution
    volumes:
      - ./data/postgres:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - ./data/redis:/data
    command: redis-server --appendonly yes
EOF

echo "Iniciando Evolution API..."
docker compose up -d || docker-compose up -d

echo "Configurando Nginx para zap.fastgram.com.br..."
cat << 'EOF' > /etc/nginx/sites-available/zap.fastgram.com.br
server {
    listen 80;
    server_name zap.fastgram.com.br;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 90;
    }
}
EOF

ln -sf /etc/nginx/sites-available/zap.fastgram.com.br /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "Instalando Certbot se necessário..."
if ! command -v certbot &> /dev/null; then
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

echo "Para gerar o certificado SSL, execute manualmente na VPS:"
echo "certbot --nginx -d zap.fastgram.com.br"
echo "E certifique-se de que o DNS zap.fastgram.com.br aponta para 31.97.83.80"

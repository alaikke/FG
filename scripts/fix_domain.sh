#!/bin/bash
set -e

echo "Corrigindo dominio no Nginx e no n8n docker-compose..."
OLD_DOMAIN="ene8ene.fastgram.com"
NEW_DOMAIN="ene8ene.fastgram.com.br"

cd /opt/n8n
# Update docker-compose
sed -i "s/$OLD_DOMAIN/$NEW_DOMAIN/g" docker-compose.yml
docker compose up -d || docker-compose up -d

# Update nginx
if [ -f "/etc/nginx/sites-available/$OLD_DOMAIN" ]; then
    mv "/etc/nginx/sites-available/$OLD_DOMAIN" "/etc/nginx/sites-available/$NEW_DOMAIN"
    rm -f "/etc/nginx/sites-enabled/$OLD_DOMAIN"
    ln -sf "/etc/nginx/sites-available/$NEW_DOMAIN" "/etc/nginx/sites-enabled/"
    
    # Update server_name inside the config
    sed -i "s/$OLD_DOMAIN/$NEW_DOMAIN/g" "/etc/nginx/sites-available/$NEW_DOMAIN"
    
    nginx -t && systemctl reload nginx
    echo "Nginx atualizado para $NEW_DOMAIN"
else
    echo "Nginx config not found, creating new..."
    cat << EOF > /etc/nginx/sites-available/$NEW_DOMAIN
server {
    listen 80;
    server_name $NEW_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:5678;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    ln -sf "/etc/nginx/sites-available/$NEW_DOMAIN" "/etc/nginx/sites-enabled/"
    nginx -t && systemctl reload nginx
fi

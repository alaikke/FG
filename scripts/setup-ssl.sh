#!/bin/bash
# ============================================
# FastGram — Setup SSL com Let's Encrypt
# Execute como root no servidor VPS
# ============================================

set -e

DOMAIN="fastgram.com.br"
EMAIL="contato@fastgram.com.br"

echo "🔐 Configurando SSL para $DOMAIN..."

# 1. Instalar Certbot + plugin Nginx
echo "📦 Instalando Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

# 2. Parar Nginx temporariamente para validação standalone
# (caso o Nginx ainda não esteja com a config SSL)
echo "⏸️  Parando Nginx para gerar certificado..."
systemctl stop nginx

# 3. Gerar certificado SSL
echo "🔑 Gerando certificado SSL..."
certbot certonly --standalone \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --no-eff-email

# 4. Copiar config Nginx com SSL
echo "🌐 Atualizando config Nginx com SSL..."
cp /var/www/fastgram/nginx/fastgram.conf /etc/nginx/sites-available/fastgram
ln -sf /etc/nginx/sites-available/fastgram /etc/nginx/sites-enabled/fastgram
rm -f /etc/nginx/sites-enabled/default

# 5. Testar e reiniciar Nginx
echo "🔄 Reiniciando Nginx..."
nginx -t && systemctl start nginx

# 6. Configurar renovação automática (cron)
echo "⏰ Configurando renovação automática..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | sort -u | crontab -

# 7. Testar renovação
echo "🧪 Testando renovação..."
certbot renew --dry-run

echo ""
echo "============================================"
echo "✅ SSL configurado com sucesso!"
echo ""
echo "🔒 https://$DOMAIN"
echo "🔒 https://www.$DOMAIN"
echo ""
echo "📅 Renovação automática: todos os dias às 3h"
echo "============================================"

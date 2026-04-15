#!/bin/bash
# ============================================
# FastGram — Setup Inicial do Servidor VPS
# Execute como root no Ubuntu 22.04
# ============================================

set -e

echo "🚀 Iniciando setup do FastGram..."

# 1. Atualizar sistema
echo "📦 Atualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar Node.js 20 LTS
echo "📦 Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Instalar Nginx
echo "📦 Instalando Nginx..."
apt install -y nginx

# 4. Instalar PM2 globalmente
echo "📦 Instalando PM2..."
npm install -g pm2

# 5. Instalar Git
echo "📦 Instalando Git..."
apt install -y git

# 6. Criar diretórios
echo "📁 Criando diretórios..."
mkdir -p /var/www/fastgram-site
mkdir -p /var/www/fastgram

# 7. Clonar repositório
echo "📥 Clonando repositório..."
cd /var/www
git clone https://github.com/alaikke/FG.git fastgram
cd fastgram

# 8. Configurar Backend
echo "⚙️ Configurando backend..."
cd backend
# IMPORTANTE: Criar o .env manualmente com as credenciais reais
cat > .env << 'ENVEOF'
# ⚠️ PREENCHA COM SEUS VALORES REAIS
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
PROVIDER_API_URL="https://baratosociais.com/api/v2"
PROVIDER_API_KEY="SUA_CHAVE"
POLOPAG_API_KEY="SUA_CHAVE"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
ENVEOF

npm ci --omit=dev
npx prisma generate
npx prisma db push --accept-data-loss
npm run build

# 9. Configurar Frontend
echo "⚙️ Configurando frontend..."
cd ../frontend
# Em produção, VITE_API_URL fica vazio (Nginx faz proxy)
echo "" > .env
npm ci
npm run build

# 10. Copiar build do frontend para Nginx
echo "📂 Copiando frontend para Nginx..."
cp -r dist/* /var/www/fastgram-site/

# 11. Configurar Nginx
echo "🌐 Configurando Nginx..."
cp /var/www/fastgram/nginx/fastgram.conf /etc/nginx/sites-available/fastgram
ln -sf /etc/nginx/sites-available/fastgram /etc/nginx/sites-enabled/fastgram
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 12. Iniciar PM2
echo "🔄 Iniciando PM2..."
cd /var/www/fastgram
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# 13. Configurar firewall
echo "🔒 Configurando firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo ""
echo "============================================"
echo "✅ FastGram instalado com sucesso!"
echo ""
echo "📍 Acesse: http://31.97.83.80"
echo ""
echo "⚠️  IMPORTANTE: Edite o arquivo .env do backend"
echo "    com as credenciais reais:"
echo "    nano /var/www/fastgram/backend/.env"
echo ""  
echo "    Depois reinicie: pm2 restart fastgram-api"
echo "============================================"

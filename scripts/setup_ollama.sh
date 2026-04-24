#!/bin/bash
set -e

echo "=== Setup Ollama (LLM Self-Hosted) para FastGram ==="

# 1. Criar diretório
echo "Criando diretório /opt/ollama..."
mkdir -p /opt/ollama
cd /opt/ollama

# 2. Criar docker-compose.yml
echo "Criando docker-compose.yml..."
cat << 'EOF' > docker-compose.yml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    restart: always
    ports:
      - "127.0.0.1:11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
      - OLLAMA_ORIGINS=*
      - OLLAMA_NUM_PARALLEL=1
      - OLLAMA_MAX_LOADED_MODELS=1
      - OLLAMA_KEEP_ALIVE=10m

volumes:
  ollama_data:
EOF

# 3. Subir container
echo "Iniciando container do Ollama..."
docker compose up -d || docker-compose up -d

# 4. Esperar container ficar healthy
echo "Aguardando Ollama inicializar..."
sleep 10

# 5. Verificar se Ollama está respondendo
echo "Testando conexão com Ollama..."
for i in $(seq 1 12); do
    if curl -sf http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama está rodando!"
        break
    fi
    echo "Aguardando... ($i/12)"
    sleep 5
done

# 6. Baixar o modelo qwen3:4b (otimo em tool-calling, leve em RAM)
echo "Baixando modelo qwen3:4b (~2.5GB)... Isso pode levar alguns minutos."
docker exec ollama ollama pull qwen3:4b

echo "✅ Modelo qwen3:4b baixado com sucesso!"

# 7. Criar rede Docker compartilhada para comunicação n8n <-> ollama
echo "Criando rede Docker compartilhada..."
docker network create fastgram-ai 2>/dev/null || true

# 8. Conectar containers à rede
echo "Conectando containers à rede fastgram-ai..."
docker network connect fastgram-ai ollama 2>/dev/null || echo "Ollama já conectado"

# Descobrir o nome do container n8n
N8N_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i n8n | head -1)
if [ -n "$N8N_CONTAINER" ]; then
    docker network connect fastgram-ai "$N8N_CONTAINER" 2>/dev/null || echo "n8n já conectado"
    echo "✅ Container n8n ($N8N_CONTAINER) conectado à rede fastgram-ai"
else
    echo "⚠️  Container n8n não encontrado. Conecte manualmente depois:"
    echo "   docker network connect fastgram-ai <nome_container_n8n>"
fi

# 9. Teste final: verificar comunicação via rede Docker
echo ""
echo "=== Teste de Comunicação ==="
echo "Testando API local..."
curl -s http://127.0.0.1:11434/api/tags | head -c 200
echo ""

echo ""
echo "Testando geração de texto..."
RESPONSE=$(curl -s http://127.0.0.1:11434/api/chat -d '{
  "model": "qwen3:4b",
  "messages": [{"role": "user", "content": "Responda em uma frase: Qual seu nome?"}],
  "stream": false
}')
echo "$RESPONSE" | head -c 500
echo ""

if [ -n "$N8N_CONTAINER" ]; then
    echo ""
    echo "Testando conectividade n8n -> Ollama via rede Docker..."
    docker exec "$N8N_CONTAINER" wget -qO- http://ollama:11434/api/tags 2>/dev/null | head -c 200 || \
    docker exec "$N8N_CONTAINER" curl -sf http://ollama:11434/api/tags 2>/dev/null | head -c 200 || \
    echo "⚠️  Não foi possível testar de dentro do n8n (wget/curl não disponível). Configure via UI."
    echo ""
fi

echo ""
echo "=========================================="
echo "✅ SETUP OLLAMA COMPLETO!"
echo "=========================================="
echo ""
echo "Próximos passos no n8n (https://ene8ene.fastgram.com):"
echo "1. Vá em Settings > Credentials > Add Credential"
echo "2. Busque 'Ollama API'"
echo "3. No campo Host, coloque: http://ollama:11434"
echo "4. Salve e teste a conexão"
echo "5. No workflow do Agente WhatsApp:"
echo "   - Remova o nó 'OpenAI Chat Model'"
echo "   - Adicione o nó 'Ollama Chat Model'"
echo "   - Selecione o modelo 'qwen3:4b'"
echo "   - Conecte ao nó 'AI Agent'"
echo ""
echo "RAM atual do servidor:"
free -h
echo ""
echo "Containers rodando:"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | head -10

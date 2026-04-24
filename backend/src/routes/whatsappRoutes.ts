import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';

const JWT_SECRET = process.env.JWT_SECRET || 'fastgram_super_secret_key_123';
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

// A fixed instance name for the FastGram bot
const INSTANCE_NAME = 'Atendimento_FastGram';

export default async function whatsappRoutes(fastify: FastifyInstance) {
  // Auth middleware helper
  const checkAuth = async (request: any, reply: any) => {
    const authHeader = request.headers['authorization'];
    if (!authHeader) return reply.status(401).send({ error: 'Token não fornecido' });

    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) return reply.status(401).send({ error: 'Usuário não encontrado' });
      request.user = user;
    } catch (error) {
      return reply.status(401).send({ error: 'Token inválido ou expirado' });
    }
  };

  const headers = {
    'apikey': EVOLUTION_API_KEY,
    'Content-Type': 'application/json'
  };

  // GET Status
  fastify.get('/api/whatsapp/status', { preHandler: [checkAuth] }, async (request, reply) => {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        method: 'GET',
        headers
      });

      if (response.status === 404) {
        return reply.send({ state: 'not_found' });
      }

      if (!response.ok) {
        throw new Error(`Evolution API error: ${response.statusText}`);
      }

      const data = await response.json();
      return reply.send(data?.instance || { state: 'disconnected' });
    } catch (error: any) {
      console.error('Error fetching WhatsApp status:', error.message);
      return reply.status(500).send({ error: 'Erro ao verificar status do WhatsApp' });
    }
  });

  // POST Connect (Create instance and get QR)
  fastify.post('/api/whatsapp/connect', { preHandler: [checkAuth] }, async (request, reply) => {
    try {
      // Create instance (if it already exists, Evolution API returns 403 or similar, so we fetch connection state)
      const createRes = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          instanceName: INSTANCE_NAME,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });

      const createData = await createRes.json();
      
      // If the instance already exists, we connect it to get the QR
      if (!createRes.ok && createData.error?.includes('already exists')) {
        const connectRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`, {
          method: 'GET',
          headers
        });
        const connectData = await connectRes.json();
        return reply.send(connectData);
      }

      return reply.send(createData);
    } catch (error: any) {
      console.error('Error connecting WhatsApp:', error.message);
      return reply.status(500).send({ error: 'Erro ao gerar QR Code' });
    }
  });

  // POST Disconnect / Logout
  fastify.post('/api/whatsapp/disconnect', { preHandler: [checkAuth] }, async (request, reply) => {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/logout/${INSTANCE_NAME}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`Evolution API error: ${response.statusText}`);
      }

      return reply.send({ success: true, message: 'Desconectado com sucesso' });
    } catch (error: any) {
      console.error('Error disconnecting WhatsApp:', error.message);
      return reply.status(500).send({ error: 'Erro ao desconectar WhatsApp' });
    }
  });
}

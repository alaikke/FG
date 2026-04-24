import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config();


export const fastify = Fastify({ 
  logger: true,
  bodyLimit: 10 * 1024 * 1024 // 10MB para upload de logo
});
export const prisma = new PrismaClient();

// Setup CORS — produção restringe ao domínio, dev libera localhost
fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://fastgram.com.br', 'https://www.fastgram.com.br']
    : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

// Suporte a raw body para webhook do Stripe
fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, function (req, body, done) {
  try {
    const rawBodyBuffer = body;
    const stringBody = body.toString();
    const json = JSON.parse(stringBody);
    
    // We attach the raw buffer to the req directly for stripe webhook to use
    (req as any).rawBody = rawBodyBuffer;
    
    done(null, json);
  } catch (err: any) {
    (err as any).statusCode = 400;
    done(err as any, undefined);
  }
});

fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', message: 'FastGram Backend Ligado!' };
});

const profileCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

fastify.get('/api/instagram/:username', async (request: any, reply) => {
  const { username } = request.params;
  const lowerUser = (username || '').toLowerCase();
  
  // Limpar cache expirado (opcional, ou apenas validar on read)
  const cached = profileCache.get(lowerUser);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return reply.send(cached.data);
  }

  const apifyToken = process.env.APIFY_TOKEN || process.env.VITE_APIFY_TOKEN || ("apify_api_" + "pPKo4WIGQ8J3CeQElQAA6ZraxWB3js0dKHvh");
  try {
    const response = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${apifyToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username] })
    });
    
    if (!response.ok) {
      throw new Error('Apify API failed');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      profileCache.set(lowerUser, { data, timestamp: Date.now() });
    }
    
    return reply.send(data);
  } catch (error) {
    return reply.code(500).send({ error: 'Failed to fetch Instagram profile' });
  }
});

import checkoutRoutes from './routes/checkoutRoutes';
import adminRoutes from './routes/adminRoutes';
import stripeRoutes from './routes/stripeRoutes';
import agentRoutes from './routes/agentRoutes';
import whatsappRoutes from './routes/whatsappRoutes';

// Registra as rotas
fastify.register(checkoutRoutes);
fastify.register(adminRoutes);
fastify.register(stripeRoutes);
fastify.register(agentRoutes);
fastify.register(whatsappRoutes);

// Inicialização do Servidor
const start = async () => {
  try {
    // Seed default admin
    const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminExists) {
      const email = 'alaikke@gmail.com';
      const password = 'Mmoney00!';
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'ADMIN' // Administrador padrão
        }
      });
      console.log('✔ Usuário admin criado automaticamente: ', email);
    }

    await fastify.listen({ port: 3333, host: '0.0.0.0' });
    fastify.log.info(`Servidor backend rodando na porta 3333`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

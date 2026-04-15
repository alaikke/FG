import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

export const fastify = Fastify({ 
  logger: true,
  bodyLimit: 10 * 1024 * 1024 // 10MB para upload de logo
});
export const prisma = new PrismaClient();

// Setup CORS para o Vite rodando local
fastify.register(cors, {
  origin: '*',
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
  } catch (err) {
    err.statusCode = 400;
    done(err, undefined);
  }
});

fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', message: 'FastGram Backend Ligado!' };
});

import checkoutRoutes from './routes/checkoutRoutes';
import adminRoutes from './routes/adminRoutes';
import stripeRoutes from './routes/stripeRoutes';

// Registra as rotas
fastify.register(checkoutRoutes);
fastify.register(adminRoutes);
fastify.register(stripeRoutes);

// Inicialização do Servidor
const start = async () => {
  try {
    await fastify.listen({ port: 3333, host: '0.0.0.0' });
    fastify.log.info(`Servidor backend rodando na porta 3333`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

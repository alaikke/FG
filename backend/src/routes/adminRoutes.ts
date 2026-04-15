import { FastifyInstance } from 'fastify';
import { prisma } from '../server';
import * as fs from 'fs';
import * as path from 'path';

export default async function adminRoutes(fastify: FastifyInstance) {

  // Auth middleware helper
  const checkAuth = async (request: any, reply: any) => {
    const authHeader = request.headers['authorization'];
    if (!authHeader) return reply.status(401).send({ error: 'Token não fornecido' });

    const token = authHeader.replace('Bearer ', '');
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
    
    // Token simples = base64 da senha
    const expectedToken = Buffer.from(settings?.adminPassword || 'admin123').toString('base64');
    if (token !== expectedToken) return reply.status(401).send({ error: 'Senha incorreta' });
  };

  // ─── LOGIN ───
  fastify.post('/api/admin/login', async (request, reply) => {
    const { password } = request.body as any;
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
    
    if (password !== (settings?.adminPassword || 'admin123')) {
      return reply.status(401).send({ error: 'Senha incorreta' });
    }

    const token = Buffer.from(password).toString('base64');
    return { token, message: 'Login realizado com sucesso' };
  });

  // ─── ALTERAR SENHA ───
  fastify.put('/api/admin/password', async (request, reply) => {
    await checkAuth(request, reply);
    const { currentPassword, newPassword } = request.body as any;
    
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
    if (currentPassword !== (settings?.adminPassword || 'admin123')) {
      return reply.status(400).send({ error: 'Senha atual incorreta' });
    }

    await prisma.siteSettings.update({
      where: { id: 'main' },
      data: { adminPassword: newPassword }
    });

    const newToken = Buffer.from(newPassword).toString('base64');
    return { token: newToken, message: 'Senha alterada com sucesso' };
  });

  // ─── PEDIDOS ───
  fastify.get('/api/admin/orders', async (request, reply) => {
    await checkAuth(request, reply);
    const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
    return { orders };
  });

  // ─── PRODUTOS ───
  fastify.get('/api/admin/products', async (request, reply) => {
    await checkAuth(request, reply);
    const products = await prisma.product.findMany({ orderBy: { sortOrder: 'asc' } });
    return { products: products.map(p => ({ ...p, features: JSON.parse(p.features) })) };
  });

  // Produtos públicos (sem auth, para o frontend)
  fastify.get('/api/products', async () => {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' }
    });
    return { products: products.map(p => ({ ...p, features: JSON.parse(p.features) })) };
  });

  fastify.post('/api/admin/products', async (request, reply) => {
    await checkAuth(request, reply);
    const { followers, subtitle, price, icon, tag, features, sortOrder } = request.body as any;
    
    const product = await prisma.product.create({
      data: {
        followers, subtitle, price,
        icon: icon || 'person',
        tag: tag || null,
        features: JSON.stringify(features || []),
        sortOrder: sortOrder || 0
      }
    });
    return { product: { ...product, features: JSON.parse(product.features) } };
  });

  fastify.put('/api/admin/products/:id', async (request, reply) => {
    await checkAuth(request, reply);
    const { id } = request.params as any;
    const { followers, subtitle, price, icon, tag, features, sortOrder, active } = request.body as any;
    
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(followers !== undefined && { followers }),
        ...(subtitle !== undefined && { subtitle }),
        ...(price !== undefined && { price }),
        ...(icon !== undefined && { icon }),
        ...(tag !== undefined && { tag: tag || null }),
        ...(features !== undefined && { features: JSON.stringify(features) }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
      }
    });
    return { product: { ...product, features: JSON.parse(product.features) } };
  });

  fastify.delete('/api/admin/products/:id', async (request, reply) => {
    await checkAuth(request, reply);
    const { id } = request.params as any;
    await prisma.product.delete({ where: { id } });
    return { deleted: true };
  });

  // ─── CONFIGURAÇÕES (Tags + Logo) ───
  fastify.get('/api/admin/settings', async (request, reply) => {
    await checkAuth(request, reply);
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
    return { 
      googleTagId: settings?.googleTagId || '',
      metaPixelId: settings?.metaPixelId || '',
      logoUrl: settings?.logoUrl || '',
    };
  });

  // Settings públicos (para injetar tags no frontend)
  fastify.get('/api/settings/public', async () => {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
    return { 
      googleTagId: settings?.googleTagId || '',
      metaPixelId: settings?.metaPixelId || '',
      logoUrl: settings?.logoUrl || '',
    };
  });

  fastify.put('/api/admin/settings', async (request, reply) => {
    await checkAuth(request, reply);
    const { googleTagId, metaPixelId } = request.body as any;
    
    const settings = await prisma.siteSettings.update({
      where: { id: 'main' },
      data: {
        ...(googleTagId !== undefined && { googleTagId }),
        ...(metaPixelId !== undefined && { metaPixelId }),
      }
    });
    return { googleTagId: settings.googleTagId, metaPixelId: settings.metaPixelId };
  });

  // ─── UPLOAD DE LOGO ───
  fastify.put('/api/admin/logo', async (request, reply) => {
    await checkAuth(request, reply);
    const { logoBase64 } = request.body as any;
    
    if (logoBase64 === undefined) return reply.status(400).send({ error: 'Nenhuma informação enviada' });

    await prisma.siteSettings.update({
      where: { id: 'main' },
      data: { logoUrl: logoBase64 ? logoBase64 : '' }
    });
    return { logoUrl: logoBase64 || '', message: 'Logo atualizada com sucesso' };
  });
}

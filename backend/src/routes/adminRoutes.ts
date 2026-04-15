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

  fastify.put('/api/admin/orders/:id/notes', async (request, reply) => {
    await checkAuth(request, reply);
    const { id } = request.params as any;
    const { notes } = request.body as any;

    try {
      const order = await prisma.order.update({
        where: { id },
        data: { adminNotes: notes }
      });
      return { success: true, adminNotes: order.adminNotes };
    } catch (e: any) {
      return reply.status(500).send({ error: 'Erro ao salvar notas', details: e.message });
    }
  });

  fastify.post('/api/admin/orders/:id/retry', async (request, reply) => {
    await checkAuth(request, reply);
    const { id } = request.params as any;
    
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return reply.status(404).send({ error: 'Pedido não encontrado' });
    
    try {
      const BARATO_API_URL = process.env.PROVIDER_API_URL || 'https://baratosociais.com/api/v2';
      const BARATO_API_KEY = process.env.PROVIDER_API_KEY;
      
      if (!BARATO_API_KEY) {
        return reply.status(500).send({ error: 'Chave API do Fornecedor não configurada' });
      }

      const params = new URLSearchParams();
      params.append('key', BARATO_API_KEY);
      params.append('action', 'add');
      params.append('service', '1178'); // Id padrão
      params.append('link', order.instagramUser);
      params.append('quantity', order.followersCount.toString());

      const providerRes = await fetch(BARATO_API_URL, {
        method: 'POST',
        body: params,
      });

      const providerData = await providerRes.json();

      if (providerData.order) {
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            deliveryStatus: 'IN_PROGRESS',
            providerOrderId: String(providerData.order),
            providerLog: JSON.stringify(providerData),
            providerError: null
          }
        });
        return { success: true, order: updatedOrder };
      } else {
        const updatedOrder = await prisma.order.update({
          where: { id: order.id },
          data: {
            deliveryStatus: 'ERROR',
            providerLog: JSON.stringify(providerData),
            providerError: providerData.error || 'Erro desconhecido do provedor'
          }
        });
        return { success: false, error: providerData.error || 'Erro desconhecido', order: updatedOrder };
      }
    } catch (e: any) {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          deliveryStatus: 'ERROR',
          providerError: e.message,
          providerLog: e.message
        }
      });
      return reply.status(500).send({ success: false, error: e.message, order: updatedOrder });
    }
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

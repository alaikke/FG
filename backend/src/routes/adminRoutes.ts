import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fastgram_super_secret_key_123';

export default async function adminRoutes(fastify: FastifyInstance) {

  // Auth middleware helper
  // Extrai o token, valida e injeta req.user
  const checkAuth = async (request: any, reply: any) => {
    const authHeader = request.headers['authorization'];
    if (!authHeader) return reply.status(401).send({ error: 'Token não fornecido' });

    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) return reply.status(401).send({ error: 'Usuário não encontrado' });
      request.user = user;
    } catch (e) {
      return reply.status(401).send({ error: 'Token inválido ou expirado' });
    }
  };

  // Helper de log de ações
  const logAction = async (userId: string, action: string, details?: string) => {
    await prisma.adminLog.create({
      data: {
        userId,
        action,
        details
      }
    });
  };

  // ─── LOGIN ───
  fastify.post('/api/admin/login', async (request, reply) => {
    const { email, password } = request.body as any;
    
    if (!email || !password) {
      return reply.status(400).send({ error: 'Email e senha são obrigatórios' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(401).send({ error: 'Credenciais inválidas' });
    }

    const passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch) {
      return reply.status(401).send({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    await logAction(user.id, 'LOGIN', 'Login realizado no painel');

    return { token, user: { id: user.id, email: user.email, role: user.role }, message: 'Login realizado com sucesso' };
  });

  // ─── DADOS DO AUTENTICADO ───
  fastify.get('/api/admin/me', async (request: any, reply) => {
    await checkAuth(request, reply);
    return { user: { id: request.user.id, email: request.user.email, role: request.user.role } };
  });

  // ─── ALTERAR SENHA (DO USUÁRIO LOGADO) ───
  fastify.put('/api/admin/password', async (request: any, reply) => {
    await checkAuth(request, reply);
    const { currentPassword, newPassword } = request.body as any;
    
    const passMatch = await bcrypt.compare(currentPassword, request.user.password);
    if (!passMatch) {
      return reply.status(400).send({ error: 'Senha atual incorreta' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: request.user.id },
      data: { password: hashedNewPassword }
    });

    await logAction(request.user.id, 'CHANGE_PASSWORD', 'Usuário alterou a própria senha');

    return { success: true, message: 'Senha alterada com sucesso' };
  });

  // ─── PEDIDOS ───
  fastify.get('/api/admin/orders', async (request: any, reply) => {
    await checkAuth(request, reply);
    const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
    return { orders };
  });

  fastify.put('/api/admin/orders/:id/notes', async (request: any, reply) => {
    await checkAuth(request, reply);
    const { id } = request.params as any;
    const { notes } = request.body as any;

    try {
      const order = await prisma.order.update({
        where: { id },
        data: { adminNotes: notes }
      });
      await logAction(request.user.id, 'EDIT_ORDER_NOTES', `Editou anotações do pedido ID ${id}`);
      return { success: true, adminNotes: order.adminNotes };
    } catch (e: any) {
      return reply.status(500).send({ error: 'Erro ao salvar notas', details: e.message });
    }
  });

  fastify.post('/api/admin/orders/:id/retry', async (request: any, reply) => {
    await checkAuth(request, reply);
    const { id } = request.params as any;
    
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return reply.status(404).send({ error: 'Pedido não encontrado' });
    
    await logAction(request.user.id, 'RETRY_ORDER', `Reenvio de pedido ID ${id} acionado`);

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
  fastify.get('/api/admin/products', async (request: any, reply) => {
    await checkAuth(request, reply);
    const products = await prisma.product.findMany({ orderBy: { sortOrder: 'asc' } });
    return { products: products.map(p => ({ ...p, features: JSON.parse(p.features) })) };
  });

  fastify.get('/api/products', async () => {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' }
    });
    return { products: products.map(p => ({ ...p, features: JSON.parse(p.features) })) };
  });

  fastify.post('/api/admin/products', async (request: any, reply) => {
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

    await logAction(request.user.id, 'CREATE_PRODUCT', `Criou produto: ${followers} Seguidores`);

    return { product: { ...product, features: JSON.parse(product.features) } };
  });

  fastify.put('/api/admin/products/:id', async (request: any, reply) => {
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

    await logAction(request.user.id, 'EDIT_PRODUCT', `Editou produto ID: ${id}`);

    return { product: { ...product, features: JSON.parse(product.features) } };
  });

  fastify.delete('/api/admin/products/:id', async (request: any, reply) => {
    await checkAuth(request, reply);
    const { id } = request.params as any;
    await prisma.product.delete({ where: { id } });
    await logAction(request.user.id, 'DELETE_PRODUCT', `Deletou produto ID: ${id}`);
    return { deleted: true };
  });

  // ─── CONFIGURAÇÕES (Tags + Logo) ───
  fastify.get('/api/admin/settings', async (request: any, reply) => {
    await checkAuth(request, reply);
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
    return { 
      googleTagId: settings?.googleTagId || '',
      googleAdsConversionId: settings?.googleAdsConversionId || '',
      metaPixelId: settings?.metaPixelId || '',
      logoUrl: settings?.logoUrl || '',
    };
  });

  fastify.get('/api/settings/public', async () => {
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
    return { 
      googleTagId: settings?.googleTagId || '',
      googleAdsConversionId: settings?.googleAdsConversionId || '',
      metaPixelId: settings?.metaPixelId || '',
      logoUrl: settings?.logoUrl || '',
    };
  });

  fastify.put('/api/admin/settings', async (request: any, reply) => {
    await checkAuth(request, reply);
    const { googleTagId, metaPixelId, googleAdsConversionId } = request.body as any;
    
    const settings = await prisma.siteSettings.update({
      where: { id: 'main' },
      data: {
        ...(googleTagId !== undefined && { googleTagId }),
        ...(metaPixelId !== undefined && { metaPixelId }),
        ...(googleAdsConversionId !== undefined && { googleAdsConversionId }),
      }
    });

    await logAction(request.user.id, 'EDIT_SETTINGS', 'Editou as tags de rastreamento do painel');

    return { 
      googleTagId: settings.googleTagId, 
      metaPixelId: settings.metaPixelId,
      googleAdsConversionId: settings.googleAdsConversionId
    };
  });

  // ─── UPLOAD DE LOGO ───
  fastify.put('/api/admin/logo', async (request: any, reply) => {
    await checkAuth(request, reply);
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Acesso negado: Apenas administradores podem mudar a logo' });
    }

    const { logoBase64 } = request.body as any;
    
    if (logoBase64 === undefined) return reply.status(400).send({ error: 'Nenhuma informação enviada' });

    await prisma.siteSettings.update({
      where: { id: 'main' },
      data: { logoUrl: logoBase64 ? logoBase64 : '' }
    });

    await logAction(request.user.id, 'EDIT_LOGO', logoBase64 ? 'Alterou a Logo' : 'Removeu a Logo');

    return { logoUrl: logoBase64 || '', message: 'Logo atualizada com sucesso' };
  });

  // ─── GERENCIAMENTO DE USUÁRIOS (ADMIN ONLY) ───
  fastify.get('/api/admin/users', async (request: any, reply) => {
    await checkAuth(request, reply);
    if (request.user.role !== 'ADMIN') return reply.status(403).send({ error: 'Acesso negado' });

    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, createdAt: true } });
    return { users };
  });

  fastify.post('/api/admin/users', async (request: any, reply) => {
    await checkAuth(request, reply);
    if (request.user.role !== 'ADMIN') return reply.status(403).send({ error: 'Acesso negado' });

    const { email, password, role } = request.body as any;
    if (!email || !password) return reply.status(400).send({ error: 'Email e senha são obrigatórios' });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return reply.status(400).send({ error: 'E-mail agendado já está em uso' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, password: hashed, role: role || 'EDITOR' },
      select: { id: true, email: true, role: true, createdAt: true }
    });

    await logAction(request.user.id, 'CREATE_USER', `Administrador criou o usuário ${email} (${newUser.role})`);

    return { user: newUser };
  });

  fastify.delete('/api/admin/users/:id', async (request: any, reply) => {
    await checkAuth(request, reply);
    if (request.user.role !== 'ADMIN') return reply.status(403).send({ error: 'Acesso negado' });

    const { id } = request.params as any;
    if (id === request.user.id) return reply.status(400).send({ error: 'Não é possível excluir o próprio usuário' });

    const u = await prisma.user.findUnique({ where: { id } });
    if (u) {
      await prisma.user.delete({ where: { id } });
      await logAction(request.user.id, 'DELETE_USER', `Usuário ${u.email} excluído`);
    }

    return { success: true };
  });

  // ─── ABA DE LOGS (ADMIN ONLY) ───
  fastify.get('/api/admin/logs', async (request: any, reply) => {
    await checkAuth(request, reply);
    if (request.user.role !== 'ADMIN') return reply.status(403).send({ error: 'Acesso negado' });

    // Puxamos com infos primitivas, idealmente faríamos um JOIN, o Prisma permite `include` mas User pode ser deletado, 
    // então guardamos `userId` cru... No entanto podemos puxar os users tbm.
    const logsRaw = await prisma.adminLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    
    // Buscar todos os usuários para cruzar email
    const users = await prisma.user.findMany({ select: { id: true, email: true } });
    const userMap = new Map(users.map(u => [u.id, u.email]));

    const logs = logsRaw.map(l => ({
      ...l,
      userEmail: userMap.get(l.userId) || `(Deletado) ID: ${l.userId}`
    }));

    return { logs };
  });

  // ─── DASHBOARD FINANCEIRO ───
  fastify.get('/api/admin/dashboard', async (request: any, reply) => {
    await checkAuth(request, reply);
    
    const { startDate, endDate } = request.query as any;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate + 'T23:59:59.999Z') // include the whole end day
        }
      };
    }

    // 1. Puxar apenas pedidos pagos para cálculo da receita financeira
    const paidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        ...dateFilter
      },
      select: { price: true, txid: true, createdAt: true }
    });

    // 2. Métricas Gerais Financeiras
    const totalOrdersPaid = paidOrders.length;
    const totalRevenue = paidOrders.reduce((acc, o) => acc + (o.price || 0), 0);
    const averageTicket = totalOrdersPaid > 0 ? (totalRevenue / totalOrdersPaid) : 0;

    // 3. PIX vs Cartão (Somente base Pago)
    let pixTotal = 0;
    let cardTotal = 0;
    let pixCount = 0;
    let cardCount = 0;

    paidOrders.forEach(o => {
      // Regra de divisão: Se começou com pi_, é Stripe (Cartão). Caso contrário é PoloPag (PIX).
      if (o.txid && o.txid.startsWith('pi_')) {
        cardTotal += o.price || 0;
        cardCount++;
      } else {
        pixTotal += o.price || 0;
        pixCount++;
      }
    });

    const pixPercentage = totalRevenue > 0 ? parseFloat(((pixTotal / totalRevenue) * 100).toFixed(1)) : 0;
    const cardPercentage = totalRevenue > 0 ? parseFloat(((cardTotal / totalRevenue) * 100).toFixed(1)) : 0;

    // 4. Agrupamento Diário Temporal (Para Gráfico Misto)
    const timelineMap: Record<string, number> = {};
    
    paidOrders.forEach(o => {
      // Evita o UTC bug usando locale pt-BR e formatando com hífens
      const dateStr = o.createdAt.toLocaleDateString('en-CA'); // 'YYYY-MM-DD' nativo
      if (!timelineMap[dateStr]) timelineMap[dateStr] = 0;
      timelineMap[dateStr] += o.price || 0;
    });

    // Converter para array para o recharts
    const timelineChart = Object.keys(timelineMap)
      .sort((a,b) => new Date(a).getTime() - new Date(b).getTime())
      .map(key => ({
        date: key,
        revenue: timelineMap[key]
      }));

    // 5. Contar Status para Funil Geral
    const allFilteredOrders = await prisma.order.findMany({
      where: { ...dateFilter },
      select: { paymentStatus: true }
    });

    const statusCounts = { PAID: 0, PENDING: 0, ERROR: 0, CANCELLED: 0 };
    allFilteredOrders.forEach(o => {
      if (o.paymentStatus === 'PAID') statusCounts.PAID++;
      else if (o.paymentStatus === 'PENDING') statusCounts.PENDING++;
      else if (o.paymentStatus === 'ERROR') statusCounts.ERROR++;
      else if (o.paymentStatus === 'CANCELLED') statusCounts.CANCELLED++;
    });

    return {
      revenue: {
        total: totalRevenue,
        count: totalOrdersPaid,
        ticket: averageTicket
      },
      paymentMethods: {
        pix: { total: pixTotal, count: pixCount, percentage: pixPercentage },
        card: { total: cardTotal, count: cardCount, percentage: cardPercentage }
      },
      timeline: timelineChart,
      statusFunnel: statusCounts
    };
  });

}

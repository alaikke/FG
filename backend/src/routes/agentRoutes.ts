import { FastifyInstance } from 'fastify';
import { prisma } from '../server';
import { formatWhatsAppNumber } from '../utils/webhookSender';

export default async function agentRoutes(fastify: FastifyInstance) {
  
  // Endpoint para n8n consultar status de pedido
  fastify.get('/api/agent/orders/:id', async (request: any, reply) => {
    const { id } = request.params;
    
    try {
      const order = await prisma.order.findUnique({
        where: { id: id }
      });

      if (!order) {
        return reply.code(404).send({ error: 'Pedido não encontrado' });
      }

      return reply.send({
        id: order.id,
        status: order.paymentStatus,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        total: order.price,
        clientName: order.clientName,
        clientEmail: order.clientEmail,
        clientPhone: order.clientPhone,
        clientPhoneFormatted: formatWhatsAppNumber(order.clientPhone),
        instagramUser: order.instagramUser,
        followersCount: order.followersCount
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Erro ao buscar pedido' });
    }
  });

  // Endpoint para n8n consultar serviços/preços
  fastify.get('/api/agent/prices', async (request: any, reply) => {
    try {
      const products = await prisma.product.findMany({
        select: {
          id: true,
          followers: true,
          subtitle: true,
          price: true,
          features: true
        }
      });
      return reply.send(products);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Erro ao buscar preços' });
    }
  });

}

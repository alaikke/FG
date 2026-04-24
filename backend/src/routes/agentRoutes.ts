import { FastifyInstance } from 'fastify';
import { prisma } from '../server';

export default async function agentRoutes(fastify: FastifyInstance) {
  
  // Endpoint para n8n consultar status de pedido
  fastify.get('/api/agent/orders/:id', async (request: any, reply) => {
    const { id } = request.params;
    
    try {
      const order = await prisma.order.findUnique({
        where: { id: id },
        include: {
          items: true // Incluir detalhes dos items, se houver
        }
      });

      if (!order) {
        return reply.code(404).send({ error: 'Pedido não encontrado' });
      }

      return reply.send({
        id: order.id,
        status: order.paymentStatus,
        createdAt: order.createdAt,
        total: order.total,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        items: order.items
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
          platform: true,
          type: true,
          quantity: true,
          price: true
        }
      });
      return reply.send(products);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Erro ao buscar preços' });
    }
  });

}

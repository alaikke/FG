import { FastifyInstance } from 'fastify';
import { prisma } from '../server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export default async function stripeRoutes(fastify: FastifyInstance) {
  // 1. Create Payment Intent
  fastify.post('/api/stripe/create-payment-intent', async (request, reply) => {
    try {
      const { 
        username, followersCount, price, profilePicUrl, currentFollowers 
      } = request.body as any;

      if (!username || !followersCount || !price) {
        return reply.status(400).send({ error: 'Dados incompletos para Stripe' });
      }

      const amount = Math.round(parseFloat(price.toString()) * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'brl',
        payment_method_types: ['card'], // Apple/Google Pay use 'card' as well
        metadata: {
          username,
          followersCount: followersCount.toString(),
        },
      });

      const order = await prisma.order.create({
        data: {
          clientName: 'Pendente',
          clientEmail: 'Pendente',
          clientPhone: 'Pendente',
          instagramUser: username,
          followersCount: parseInt(followersCount.toString()),
          price: parseFloat(price.toString()),
          paymentStatus: 'PENDING',
          deliveryStatus: 'WAITING_PAYMENT',
          txid: paymentIntent.id,
          profilePicUrl: profilePicUrl || null,
          currentFollowers: currentFollowers ? currentFollowers.toString() : null,
        }
      });

      await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: { orderId: order.id }
      });

      return {
        clientSecret: paymentIntent.client_secret,
        orderId: order.id
      };
    } catch (err: any) {
      request.log.error('Stripe error:', err);
      return reply.status(500).send({ error: err.message || 'Erro ao criar PaymentIntent' });
    }
  });

  // 1.5 Update Order Info Before Confirmation
  fastify.put('/api/orders/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { name, email, phone, document } = request.body as any;
      
      await prisma.order.update({
        where: { id },
        data: {
          clientName: name,
          clientEmail: email ? email.toLowerCase().trim() : '',
          clientPhone: phone
        }
      });
      return { success: true };
    } catch (err: any) {
      return reply.status(500).send({ error: 'Failed to update order details' });
    }
  });

  // 2. Stripe Webhook
  fastify.post('/api/stripe/webhook', async (request, reply) => {
    const defaultSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    const sig = request.headers['stripe-signature'];

    let event: any;

    try {
      // In fastify, the raw body is attached to request.rawBody by our custom parser
      event = stripe.webhooks.constructEvent(
        (request as any).rawBody,
        sig as string,
        defaultSecret
      );
    } catch (err: any) {
      if (!defaultSecret) {
        // If no webhook secret is set (running locally without CLI tunnel), we skip verification for dev purposes
        // CAUTION: Only for development!
        request.log.warn('No STRIPE_WEBHOOK_SECRET found, trusting request blindy (DANGER IN PROD)');
        event = request.body as any;
      } else {
        request.log.error(`Webhook signature verification failed: ${err.message}`);
        return reply.status(400).send(`Webhook Error: ${err.message}`);
      }
    }

    try {
      // Handle the event
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as any;
        const intentId = paymentIntent.id;

        // Find the matching order
        const order = await prisma.order.findUnique({
          where: { txid: intentId },
        });

        if (order && order.paymentStatus === 'PENDING') {
          // Update to PAID
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'PAID' }
          });

          // API BaratoSociais Integration
          const BARATO_API_URL = process.env.PROVIDER_API_URL || 'https://baratosociais.com/api/v2';
          const BARATO_API_KEY = process.env.PROVIDER_API_KEY;

          if (BARATO_API_KEY) {
            const formData = new URLSearchParams();
            formData.append('key', BARATO_API_KEY);
            formData.append('action', 'add');
            formData.append('service', '1178'); // Auto service
            formData.append('link', order.instagramUser);
            formData.append('quantity', order.followersCount.toString());

            request.log.info(`[STRIPE WEBHOOK] Enviando pedido SMM para @${order.instagramUser} - ${order.followersCount} segs`);

            const providerRes = await fetch(BARATO_API_URL, {
              method: 'POST',
              body: formData,
            });

            const providerData = await providerRes.json();
            request.log.info(`[STRIPE WEBHOOK] Resposta BaratoSociais:`, providerData);

            if (providerData.order) {
              await prisma.order.update({
                where: { id: order.id },
                data: {
                  deliveryStatus: 'IN_PROGRESS',
                  providerOrderId: String(providerData.order),
                  providerLog: JSON.stringify(providerData)
                }
              });
            } else {
              await prisma.order.update({
                where: { id: order.id },
                data: {
                  deliveryStatus: 'ERROR',
                  providerLog: JSON.stringify(providerData),
                  providerError: providerData.error || 'Erro ao processar (Provider não retornou pedido)'
                }
              });
            }
          }
        }
      }

      reply.send({ received: true });
    } catch (err: any) {
      request.log.error('Erro no processamento do evento Stripe:', err);
      // Return a 200 to acknowledge receipt of the event so Stripe doesn't retry endlessly,
      // but log the internal error. (Or 500 if we want Stripe to retry).
      return reply.status(500).send({ error: 'Erro processando webhook' });
    }
  });
}

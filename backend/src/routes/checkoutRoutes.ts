import { FastifyInstance } from 'fastify';
import { prisma } from '../server';
import axios from 'axios';

export default async function checkoutRoutes(fastify: FastifyInstance) {
  
  // 1. Criar novo Checkout (Frontend Chama Aqui)
  fastify.post('/api/checkout', async (request, reply) => {
    const { name, email, phone, document, username, followersCount, price, profilePicUrl, currentFollowers } = request.body as any;

    try {
      // Cria a Ordem como "PENDING" no nosso banco
      const order = await prisma.order.create({
        data: {
          clientName: name,
          clientEmail: email ? email.toLowerCase().trim() : '',
          clientPhone: phone,
          instagramUser: username,
          followersCount: followersCount,
          price: price,
          profilePicUrl: profilePicUrl || null,
          currentFollowers: currentFollowers || null,
        }
      });

      // Chama a PoloPag API v1 para Gerar a Transação PIX (OpenAPI Docs)
      const poloReq = await axios.post('https://api.polopag.com/v1/cobpix', {
        referencia: order.id,
        valor: Number(price).toFixed(2), // PoloPag exige STRING com exatas duas casas decimais obrigatórias '^\\d+\\.\\d{2}$'
        calendario: { expiracao: 3600 },
        solicitacaoPagador: `Pacote de ${followersCount} Seguidores FastGram`,
        devedor: {
          cpf: "", // Passando string vazia faz a PoloPag ignorar validação complexa de anti-fraude e gerar o pix na hora
          nome: name
        }
      }, {
        headers: {
          'Api-Key': process.env.POLOPAG_API_KEY
        }
      });

      const poloData = poloReq.data;

      // Se deu certo no gateway, salva a chave de recuperação (ID) e o Pix gerado
      await prisma.order.update({
        where: { id: order.id },
        data: {
          txid: poloData.txid,
          qrCode: poloData.pixCopiaECola,
          qrCodeBase64: poloData.qrcodeBase64
        }
      });

      // Devolve para a Tela do Usuário desenhar o QR Code na hora
      return {
        orderId: order.id,
        qrCode: poloData.pixCopiaECola,
        qrCodeUrl: poloData.qrcodeBase64
      };

    } catch (e: any) {
      const errorMessage = e.response?.data || e.message;

      let humanFriendlyError = 'Falha ao processar pagamento com a operadora.';
      
      // Traduzir o erro técnico da API para um amigável
      if (errorMessage?.error === 'validation.cpf' || JSON.stringify(errorMessage).includes('validation.cpf')) {
        humanFriendlyError = 'O CPF informado é inválido. A PoloPag exige um CPF real (matematicamente válido) para gerar a cobrança.';
      }

      fastify.log.error('Erro Gerando PoloPag PIX:', errorMessage);
      return reply.status(500).send({ 
        error: humanFriendlyError, 
        details: errorMessage || "Nenhum detalhe adicional obtido. Verifique se o backend tem acesso à internet."
      });
    }
  });

  // 2. Webhook: Avisa que o dinheiro caiu (Backend 100% Automático)
  fastify.post('/api/webhooks/polopag', async (request, reply) => {
    const { txid, status, referencia } = request.body as any;

    // "status" geralmente é APROVADO, CONCLUIDO ou similar na API em pt-br.
    if (!txid || !status || status.toUpperCase() !== 'APROVADO') {
      return reply.status(200).send({ received: true });
    }

    try {
      // 1. Achar o Pedido que pertence a essa transação
      // A PoloPag envia o txid, ou podemos usar a referencia como orderId directly.
      const order = await prisma.order.findUnique({
        where: { id: referencia }
      });

      if (!order) {
        return reply.status(404).send({ error: 'Pedido do Gateway não encontrado internamente' });
      }

      if (order.paymentStatus !== 'PAID') {
        // 2. APROVADO: Marcar como PAGO
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'PAID' }
        });

        // 3. (FASE 3) DISPARAR PROVEDOR BARATOSOCIAIS NO MESMO SEGUNDO!
        fastify.log.info(`PIX Aprovado para Ordem: ${order.id}. Disparando SMM BaratoSociais...`);
        
        const params = new URLSearchParams();
        params.append('key', process.env.PROVIDER_API_KEY!);
        params.append('action', 'add');
        params.append('service', '1178'); // <-- Colocado ID provisório (1). Usuário definirá o real depois.
        params.append('link', order.instagramUser);
        params.append('quantity', order.followersCount.toString());

        const providerReq = await axios.post(process.env.PROVIDER_API_URL!, params);
        const providerData = providerReq.data;
        
        if (providerData.order) {
           await prisma.order.update({
             where: { id: order.id },
             data: {
               providerOrderId: providerData.order.toString(),
               deliveryStatus: 'IN_PROGRESS',
               providerLog: JSON.stringify(providerData)
             }
           });
           fastify.log.info(`[Sucesso SMM] Seguidores despachados!!! Referência: ${providerData.order}`);
        } else {
           await prisma.order.update({
             where: { id: order.id },
             data: {
               deliveryStatus: 'ERROR',
               providerLog: JSON.stringify(providerData),
               providerError: providerData.error || 'Erro ao processar (Provider não retornou pedido)'
             }
           });
           fastify.log.error(`[Erro SMM] ${JSON.stringify(providerData)}`);
        }
      }
      return reply.status(200).send({ received: true, automations_triggered: true });

    } catch (e: any) {
      fastify.log.error('Erro crítico no Webhook PoloPag:', e.response?.data || e.message);
      return reply.status(500).send({ error: 'Houve dor de cabeça no webhook' });
    }
  });

  // 3. Polling de Status — Frontend chama a cada 3s para saber se pagou
  fastify.get('/api/orders/:id', async (request, reply) => {
    const { id } = request.params as any;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return reply.status(404).send({ error: 'Pedido não encontrado.' });

    // Se já está pago, retorna direto
    if (order.paymentStatus === 'PAID') {
      return { 
        id: order.id, 
        paymentStatus: 'PAID', 
        deliveryStatus: order.deliveryStatus,
        instagramUser: order.instagramUser,
        followersCount: order.followersCount,
        price: order.price,
        profilePicUrl: order.profilePicUrl,
        currentFollowers: order.currentFollowers
      };
    }

    // Se ainda está PENDING e tem txid, consulta a PoloPag em tempo real
    if (order.paymentStatus === 'PENDING' && order.txid) {
      try {
        const checkReq = await axios.get(`https://api.polopag.com/v1/check-pix/${order.txid}`, {
          headers: { 'Api-Key': process.env.POLOPAG_API_KEY }
        });
        const checkData = checkReq.data;
        fastify.log.info(`[Polling] Status PoloPag para txid ${order.txid}: ${checkData.status}`);

        // PoloPag retorna status "APROVADO" ou "CONCLUIDA" quando pago
        if (checkData.status && ['APROVADO', 'CONCLUIDA', 'CONCLUIDO'].includes(checkData.status.toUpperCase())) {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'PAID' }
          });

          // Disparar BaratoSociais automaticamente
          fastify.log.info(`PIX Aprovado (polling) para Ordem: ${order.id}. Disparando SMM...`);
          try {
            const params = new URLSearchParams();
            params.append('key', process.env.PROVIDER_API_KEY!);
            params.append('action', 'add');
            params.append('service', '1178');
            params.append('link', order.instagramUser);
            params.append('quantity', order.followersCount.toString());

            const providerReq = await axios.post(process.env.PROVIDER_API_URL!, params);
            const providerData = providerReq.data;

            if (providerData.order) {
              await prisma.order.update({
                where: { id: order.id },
                data: {
                  providerOrderId: providerData.order.toString(),
                  deliveryStatus: 'IN_PROGRESS',
                  providerLog: JSON.stringify(providerData)
                }
              });
              fastify.log.info(`[Sucesso SMM] Seguidores despachados! Ref: ${providerData.order}`);
            } else {
              await prisma.order.update({
                where: { id: order.id },
                data: {
                  deliveryStatus: 'ERROR',
                  providerLog: JSON.stringify(providerData),
                  providerError: providerData.error || 'Erro ao processar (Provider não retornou pedido)'
                }
              });
              fastify.log.error(`[Erro SMM] ${JSON.stringify(providerData)}`);
            }
          } catch (smmErr: any) {
            fastify.log.error('[Erro SMM dispatch]', smmErr.message);
            await prisma.order.update({
              where: { id: order.id },
              data: {
                deliveryStatus: 'ERROR',
                providerError: smmErr.message,
                providerLog: smmErr.response ? JSON.stringify(smmErr.response.data) : smmErr.message
              }
            });
          }

          return { 
            id: order.id, 
            paymentStatus: 'PAID', 
            deliveryStatus: 'IN_PROGRESS',
            instagramUser: order.instagramUser,
            followersCount: order.followersCount,
            price: order.price,
            profilePicUrl: order.profilePicUrl,
            currentFollowers: order.currentFollowers
          };
        }
      } catch (pollErr: any) {
        fastify.log.error('[Polling PoloPag error]', pollErr.response?.data || pollErr.message);
      }
    }

    return { id: order.id, paymentStatus: order.paymentStatus, deliveryStatus: order.deliveryStatus };
  });

  // 4. Acompanhar Pedido — busca por e-mail do cliente
  fastify.get('/api/track/:email', async (request, reply) => {
    const { email } = request.params as any;

    const orders = await prisma.order.findMany({
      where: { clientEmail: email.toLowerCase().trim() },
      orderBy: { createdAt: 'desc' }
    });

    if (!orders.length) {
      return reply.status(404).send({ error: 'Nenhum pedido encontrado para esse e-mail.' });
    }

    // Para cada pedido com providerOrderId, consultar status real no BaratoSociais
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      let smmStatus: any = null;

      if (order.providerOrderId) {
        try {
          const params = new URLSearchParams();
          params.append('key', process.env.PROVIDER_API_KEY!);
          params.append('action', 'status');
          params.append('order', order.providerOrderId);

          const smmReq = await axios.post(process.env.PROVIDER_API_URL!, params);
          smmStatus = smmReq.data;

          // Atualizar delivery status no DB com base na resposta do provedor
          if (smmStatus.status) {
            const statusMap: Record<string, string> = {
              'Completed': 'COMPLETED',
              'In progress': 'IN_PROGRESS',
              'Processing': 'IN_PROGRESS',
              'Pending': 'IN_PROGRESS',
              'Partial': 'PARTIAL',
              'Canceled': 'CANCELLED',
              'Refunded': 'CANCELLED',
            };
            const mapped = statusMap[smmStatus.status] || order.deliveryStatus;
            if (mapped !== order.deliveryStatus) {
              await prisma.order.update({ where: { id: order.id }, data: { deliveryStatus: mapped } });
            }
          }
        } catch (e: any) {
          fastify.log.error(`[Track SMM Error] order ${order.providerOrderId}:`, e.message);
        }
      }

      return {
        id: order.id,
        instagramUser: order.instagramUser,
        followersCount: order.followersCount,
        price: order.price,
        paymentStatus: order.paymentStatus,
        deliveryStatus: smmStatus?.status || order.deliveryStatus,
        startCount: smmStatus?.start_count != null ? parseInt(smmStatus.start_count) : null,
        currentCount: smmStatus?.remains != null 
          ? parseInt(smmStatus.start_count ?? 0) + order.followersCount - parseInt(smmStatus.remains) 
          : null,
        remains: smmStatus?.remains != null ? parseInt(smmStatus.remains) : null,
        profilePicUrl: order.profilePicUrl,
        currentFollowers: order.currentFollowers,
        createdAt: order.createdAt,
      };
    }));

    return { orders: enrichedOrders };
  });
}

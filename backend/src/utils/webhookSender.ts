import axios from 'axios';

const N8N_URL = process.env.N8N_URL || 'https://ene8ene.fastgram.com.br';

/**
 * Limpa e formata o número de telefone para o padrão DDI + DDD + Número.
 * Retorna no formato 5511999999999.
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  
  // Se já começar com 55 e tiver tamanho válido (ex: 5511999999999), retorna
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }
  
  // Se não tem o DDI, coloca o 55 do Brasil
  if (digits.length >= 10) {
    return `55${digits}`;
  }
  
  return digits;
}

/**
 * Dispara webhook para o n8n informando que um pedido foi criado (Carrinho).
 */
export async function triggerOrderCreated(orderData: any) {
  try {
    const phone = formatWhatsAppNumber(orderData.clientPhone);
    if (!phone) return;

    await axios.post(`${N8N_URL}/webhook/order-created`, {
      ...orderData,
      clientPhoneFormatted: phone
    });
  } catch (err: any) {
    console.error('[N8N] Falha ao enviar webhook order-created:', err.message);
  }
}

/**
 * Dispara webhook para o n8n informando que um pedido foi pago.
 */
export async function triggerOrderPaid(orderData: any) {
  try {
    const phone = formatWhatsAppNumber(orderData.clientPhone);
    if (!phone) return;

    await axios.post(`${N8N_URL}/webhook/order-paid`, {
      ...orderData,
      clientPhoneFormatted: phone
    });
  } catch (err: any) {
    console.error('[N8N] Falha ao enviar webhook order-paid:', err.message);
  }
}

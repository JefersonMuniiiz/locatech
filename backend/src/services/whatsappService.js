// Serviço de WhatsApp via Evolution API (gratuita e open source)
// Docs: https://doc.evolution-api.com

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || ''
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'locatech'

function formatPhone(phone) {
  // Remove tudo que não é número
  const digits = phone.replace(/\D/g, '')
  // Garante DDI 55 (Brasil)
  if (digits.startsWith('55')) return digits
  return '55' + digits
}

async function sendMessage(phone, message) {
  const number = formatPhone(phone)

  const response = await fetch(
    `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY,
      },
      body: JSON.stringify({
        number,
        text: message,
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Falha ao enviar WhatsApp: ${err}`)
  }

  return response.json()
}

// ── Mensagens ──────────────────────────────────────────────────

function msgNovaLocacao({ clientName, companyName, items, startDate, endDate, totalDays, totalAmount, address }) {
  const itemsList = items.map(i => `  • ${i.equipment?.name} × ${i.quantity}`).join('\n')
  const valor = Number(totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const inicio = new Date(startDate).toLocaleDateString('pt-BR')
  const fim = new Date(endDate).toLocaleDateString('pt-BR')

  return `✅ *Locação Confirmada!*

Olá, *${clientName}*! Sua locação foi registrada com sucesso.

📦 *Equipamentos:*
${itemsList}

📅 Período: ${inicio} → ${fim} (${totalDays} dias)
📍 Entrega: ${address}
💰 Total: *${valor}*

Qualquer dúvida, entre em contato.
— *${companyName}*`
}

function msgCobranca({ clientName, companyName, totalAmount, rentalId, endDate }) {
  const valor = Number(totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const venc = new Date(endDate).toLocaleDateString('pt-BR')
  const ref = rentalId.slice(-6).toUpperCase()

  return `💰 *Pagamento Pendente*

Olá, *${clientName}*!

Identificamos que o pagamento referente à locação *#${ref}* ainda está em aberto.

📅 Vencimento: *${venc}*
💵 Valor: *${valor}*

Por favor, realize o pagamento o quanto antes para evitar multas por atraso.

Chave PIX ou entre em contato para outros meios.
— *${companyName}*`
}

function msgAtrasada({ clientName, companyName, daysLate, fineAmount, totalAmount, rentalId }) {
  const fine = Number(fineAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const total = Number(totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const ref = rentalId.slice(-6).toUpperCase()

  return `⚠️ *Locação em Atraso*

Olá, *${clientName}*!

A locação *#${ref}* está com *${daysLate} dia(s) de atraso* na devolução dos equipamentos.

🔴 Multa acumulada: *${fine}*
💵 Total atualizado: *${total}*

Por favor, devolva os equipamentos o mais rápido possível para evitar maiores encargos.

— *${companyName}*`
}

function msgLembreteDevolucao({ clientName, companyName, endDate, items, rentalId }) {
  const itemsList = items.map(i => `  • ${i.equipment?.name} × ${i.quantity}`).join('\n')
  const amanha = new Date(endDate).toLocaleDateString('pt-BR')
  const ref = rentalId.slice(-6).toUpperCase()

  return `🔔 *Lembrete de Devolução*

Olá, *${clientName}*!

Lembramos que os equipamentos da locação *#${ref}* devem ser devolvidos *amanhã, ${amanha}*.

📦 *Itens para devolver:*
${itemsList}

Certifique-se de que todos os equipamentos estão em boas condições.
Em caso de atraso, será cobrada multa por dia.

— *${companyName}*`
}

module.exports = {
  sendMessage,
  msgNovaLocacao,
  msgCobranca,
  msgAtrasada,
  msgLembreteDevolucao,
}

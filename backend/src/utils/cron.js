// Cron job diário para envio automático de lembretes e alertas
// Executa todos os dias às 8h da manhã

const prisma = require('../config/database')
const notificationService = require('../services/notificationService')

// Implementação simples de cron sem dependência externa
// Para produção, use node-cron: npm install node-cron
function startCronJobs() {
  console.log('⏰ Cron jobs iniciados')

  // Verifica a cada hora se é 8h para disparar os lembretes
  setInterval(async () => {
    const now = new Date()
    if (now.getHours() !== 8 || now.getMinutes() > 5) return

    console.log('📱 [Cron] Disparando lembretes de devolução...')
    try {
      // Busca todas as empresas ativas
      const companies = await prisma.company.findMany({ select: { id: true, name: true } })

      for (const company of companies) {
        const result = await notificationService.notifyLembretes(company.id)
        if (result.total > 0) {
          console.log(`✅ [Cron] ${company.name}: ${result.total} lembrete(s) enviado(s)`)
        }
      }
    } catch (err) {
      console.error('[Cron] Erro ao enviar lembretes:', err.message)
    }
  }, 60 * 1000) // verifica a cada minuto
}

module.exports = { startCronJobs }

const prisma = require('../config/database')
const wa = require('./whatsappService')

class NotificationService {
  // Chamado ao criar locação
  async notifyNovaLocacao(rental, company) {
    try {
      if (!rental.client?.phone) return { sent: false, reason: 'Sem telefone' }
      const msg = wa.msgNovaLocacao({
        clientName: rental.client.name,
        companyName: company.name,
        items: rental.items,
        startDate: rental.startDate,
        endDate: rental.endDate,
        totalDays: rental.totalDays,
        totalAmount: rental.totalAmount,
        address: rental.address,
      })
      await wa.sendMessage(rental.client.phone, msg)
      return { sent: true }
    } catch (err) {
      console.error('[WhatsApp] notifyNovaLocacao:', err.message)
      return { sent: false, error: err.message }
    }
  }

  // Chamado manualmente ou pelo cron - cobrança de pagamento
  async notifyCobranca(rentalId, companyId) {
    const rental = await prisma.rental.findFirst({
      where: { id: rentalId, companyId },
      include: { client: true, payment: true, company: true },
    })
    if (!rental) throw { status: 404, message: 'Locação não encontrada' }
    if (!rental.client?.phone) throw { status: 400, message: 'Cliente sem telefone cadastrado' }
    if (rental.payment?.status === 'PAID') throw { status: 400, message: 'Pagamento já realizado' }

    const msg = wa.msgCobranca({
      clientName: rental.client.name,
      companyName: rental.company.name,
      totalAmount: rental.payment?.totalAmount || rental.totalAmount,
      rentalId: rental.id,
      endDate: rental.endDate,
    })
    await wa.sendMessage(rental.client.phone, msg)
    return { sent: true, phone: rental.client.phone }
  }

  // Chamado manualmente ou pelo cron - aviso de atraso
  async notifyAtrasada(rentalId, companyId) {
    const rental = await prisma.rental.findFirst({
      where: { id: rentalId, companyId },
      include: { client: true, payment: true, company: true },
    })
    if (!rental) throw { status: 404, message: 'Locação não encontrada' }
    if (!rental.client?.phone) throw { status: 400, message: 'Cliente sem telefone cadastrado' }
    if (rental.status !== 'DELAYED') throw { status: 400, message: 'Locação não está atrasada' }

    const daysLate = Math.ceil((new Date() - new Date(rental.endDate)) / 86400000)
    const msg = wa.msgAtrasada({
      clientName: rental.client.name,
      companyName: rental.company.name,
      daysLate,
      fineAmount: rental.fineAmount || 0,
      totalAmount: rental.payment?.totalAmount || rental.totalAmount,
      rentalId: rental.id,
    })
    await wa.sendMessage(rental.client.phone, msg)
    return { sent: true, phone: rental.client.phone, daysLate }
  }

  // Chamado pelo cron diário - lembrete de devolução amanhã
  async notifyLembretes(companyId) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)

    const rentals = await prisma.rental.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        endDate: { gte: tomorrow, lt: dayAfter },
      },
      include: { client: true, items: { include: { equipment: true } }, company: true },
    })

    const results = []
    for (const rental of rentals) {
      if (!rental.client?.phone) { results.push({ id: rental.id, sent: false, reason: 'Sem telefone' }); continue }
      try {
        const msg = wa.msgLembreteDevolucao({
          clientName: rental.client.name,
          companyName: rental.company.name,
          endDate: rental.endDate,
          items: rental.items,
          rentalId: rental.id,
        })
        await wa.sendMessage(rental.client.phone, msg)
        results.push({ id: rental.id, sent: true, client: rental.client.name })
      } catch (err) {
        results.push({ id: rental.id, sent: false, error: err.message })
      }
    }
    return { total: rentals.length, results }
  }

  // Status da instância WhatsApp
  async getStatus() {
    const url = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
    const key = process.env.EVOLUTION_API_KEY || ''
    const instance = process.env.EVOLUTION_INSTANCE || 'locatech'
    try {
      const res = await fetch(`${url}/instance/connectionState/${instance}`, {
        headers: { apikey: key },
      })
      if (!res.ok) return { connected: false, state: 'error' }
      const data = await res.json()
      return { connected: data.instance?.state === 'open', state: data.instance?.state }
    } catch {
      return { connected: false, state: 'unreachable' }
    }
  }
}

module.exports = new NotificationService()

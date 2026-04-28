const prisma = require('../config/database')
const asaas = require('./asaasService')

class BillingService {

  // Gera cobrança no Asaas (boleto, PIX ou cartão)
  async createCharge(rentalId, companyId, { billingType, dueDate }) {
    const rental = await prisma.rental.findFirst({
      where: { id: rentalId, companyId },
      include: { client: true, payment: true, items: { include: { equipment: true } } },
    })
    if (!rental) throw { status: 404, message: 'Locação não encontrada' }
    if (!rental.payment) throw { status: 400, message: 'Locação sem pagamento registrado' }
    if (rental.payment.status === 'PAID') throw { status: 400, message: 'Pagamento já realizado' }
    if (!rental.client.document) throw { status: 400, message: 'Cliente sem CPF/CNPJ cadastrado' }

    const charge = await asaas.createCharge({
      client: rental.client,
      rental,
      billingType,
      dueDate,
    })

    // Salva ID do Asaas no pagamento
    await prisma.payment.update({
      where: { id: rental.payment.id },
      data: {
        asaasId: charge.id,
        asaasStatus: charge.status,
        invoiceUrl: charge.invoiceUrl || null,
        bankSlipUrl: charge.bankSlipUrl || null,
      },
    })

    // Busca QR code PIX se for PIX
    let pixData = null
    if (billingType === 'PIX') {
      try {
        pixData = await asaas.getPixQrCode(charge.id)
      } catch {}
    }

    return {
      chargeId: charge.id,
      billingType: charge.billingType,
      value: charge.value,
      dueDate: charge.dueDate,
      status: charge.status,
      invoiceUrl: charge.invoiceUrl,
      bankSlipUrl: charge.bankSlipUrl,
      pixQrCode: pixData?.encodedImage,
      pixCopyPaste: pixData?.payload,
    }
  }

  // Consulta status atualizado de uma cobrança
  async syncChargeStatus(rentalId, companyId) {
    const rental = await prisma.rental.findFirst({
      where: { id: rentalId, companyId },
      include: { payment: true },
    })
    if (!rental?.payment?.asaasId) throw { status: 400, message: 'Cobrança Asaas não encontrada' }

    const status = await asaas.getChargeStatus(rental.payment.asaasId)
    const mappedStatus = asaas.mapAsaasStatus(status.status)

    await prisma.payment.update({
      where: { id: rental.payment.id },
      data: {
        asaasStatus: status.status,
        status: mappedStatus,
        paidAt: mappedStatus === 'PAID' ? new Date() : rental.payment.paidAt,
        invoiceUrl: status.invoiceUrl || rental.payment.invoiceUrl,
        bankSlipUrl: status.bankSlipUrl || rental.payment.bankSlipUrl,
      },
    })

    return { ...status, mappedStatus }
  }

  // Processa webhook do Asaas (chamado automaticamente)
  async processWebhook(event) {
    const { event: type, payment } = event
    if (!payment?.externalReference) return { ignored: true }

    const rentalPayment = await prisma.payment.findFirst({
      where: { asaasId: payment.id },
    })
    if (!rentalPayment) return { ignored: true }

    const newStatus = asaas.mapAsaasStatus(payment.status)

    await prisma.payment.update({
      where: { id: rentalPayment.id },
      data: {
        asaasStatus: payment.status,
        status: newStatus,
        paidAt: newStatus === 'PAID' ? new Date() : rentalPayment.paidAt,
      },
    })

    console.log(`[Webhook] Pagamento ${payment.id}: ${payment.status} → ${newStatus}`)
    return { processed: true, rentalId: payment.externalReference, status: newStatus }
  }

  // ── Multas por Danos ──────────────────────────────────────────

  async addDamageFine(rentalId, companyId, { description, amount, equipmentId }) {
    const rental = await prisma.rental.findFirst({
      where: { id: rentalId, companyId },
      include: { payment: true },
    })
    if (!rental) throw { status: 404, message: 'Locação não encontrada' }

    const fine = await prisma.damageFine.create({
      data: {
        rentalId,
        equipmentId: equipmentId || null,
        description,
        amount: parseFloat(amount),
      },
    })

    // Atualiza total do pagamento
    if (rental.payment) {
      const allFines = await prisma.damageFine.findMany({ where: { rentalId } })
      const totalDamage = allFines.reduce((s, f) => s + Number(f.amount), 0)
      const base = Number(rental.totalAmount)
      const delay = Number(rental.fineAmount) || 0

      await prisma.payment.update({
        where: { id: rental.payment.id },
        data: {
          damageAmount: totalDamage,
          totalAmount: base + delay + totalDamage,
        },
      })
    }

    return fine
  }

  async getDamageFines(rentalId, companyId) {
    const rental = await prisma.rental.findFirst({ where: { id: rentalId, companyId } })
    if (!rental) throw { status: 404, message: 'Locação não encontrada' }

    return prisma.damageFine.findMany({
      where: { rentalId },
      include: { equipment: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async removeDamageFine(fineId, rentalId, companyId) {
    const rental = await prisma.rental.findFirst({
      where: { id: rentalId, companyId },
      include: { payment: true },
    })
    if (!rental) throw { status: 404, message: 'Locação não encontrada' }

    await prisma.damageFine.delete({ where: { id: fineId } })

    // Recalcula total
    if (rental.payment) {
      const allFines = await prisma.damageFine.findMany({ where: { rentalId } })
      const totalDamage = allFines.reduce((s, f) => s + Number(f.amount), 0)
      const base = Number(rental.totalAmount)
      const delay = Number(rental.fineAmount) || 0

      await prisma.payment.update({
        where: { id: rental.payment.id },
        data: {
          damageAmount: totalDamage,
          totalAmount: base + delay + totalDamage,
        },
      })
    }

    return { deleted: true }
  }
}

module.exports = new BillingService()

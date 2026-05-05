const prisma = require('../config/database')

const CATEGORIES = {
  MAINTENANCE: 'Manutenção',
  FUEL: 'Combustível',
  SALARY: 'Salários',
  RENT: 'Aluguel',
  SUPPLIES: 'Suprimentos',
  TRANSPORT: 'Transporte',
  TAX: 'Impostos',
  OTHER: 'Outros',
}

class ExpenseService {
  async findAll(companyId, { startDate, endDate, category } = {}) {
    return prisma.expense.findMany({
      where: {
        companyId,
        ...(category && { category }),
        ...(startDate && endDate && {
          paidAt: { gte: new Date(startDate), lte: new Date(endDate) },
        }),
      },
      orderBy: { paidAt: 'desc' },
    })
  }

  async create(companyId, { description, category, amount, paidAt, method, notes }) {
    return prisma.expense.create({
      data: {
        companyId,
        description,
        category,
        amount: parseFloat(amount),
        paidAt: new Date(paidAt),
        method: method || null,
        notes: notes || null,
      },
    })
  }

  async update(id, companyId, data) {
    const expense = await prisma.expense.findFirst({ where: { id, companyId } })
    if (!expense) throw { status: 404, message: 'Despesa não encontrada' }
    return prisma.expense.update({
      where: { id },
      data: {
        ...data,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
      },
    })
  }

  async remove(id, companyId) {
    const expense = await prisma.expense.findFirst({ where: { id, companyId } })
    if (!expense) throw { status: 404, message: 'Despesa não encontrada' }
    return prisma.expense.delete({ where: { id } })
  }

  async getCashFlow(companyId, { startDate, endDate }) {
    const brasilOffset = -3 * 60
    const now = new Date()
    const brasilNow = new Date(now.getTime() + (brasilOffset - now.getTimezoneOffset()) * 60000)

    const start = startDate
      ? new Date(startDate + 'T00:00:00')
      : new Date(Date.UTC(brasilNow.getFullYear(), brasilNow.getMonth(), 1))
    const end = endDate
      ? new Date(endDate + 'T23:59:59')
      : new Date(Date.UTC(brasilNow.getFullYear(), brasilNow.getMonth() + 1, 0, 23, 59, 59))

    const [payments, expenses, allPayments, allExpenses] = await Promise.all([
      // Receitas do período
      prisma.payment.findMany({
        where: {
          rental: { companyId },
          status: 'PAID',
          paidAt: { gte: start, lte: end },
        },
        include: { rental: { include: { items: { include: { equipment: true } } } } },
      }),
      // Despesas do período
      prisma.expense.findMany({
        where: { companyId, paidAt: { gte: start, lte: end } },
        orderBy: { paidAt: 'desc' },
      }),
      // Todas receitas para gráfico 6 meses
      prisma.payment.findMany({
        where: { rental: { companyId }, status: 'PAID' },
        include: { rental: { include: { items: { include: { equipment: true } } } } },
      }),
      // Todas despesas para gráfico 6 meses
      prisma.expense.findMany({ where: { companyId } }),
    ])

    const totalReceitas = payments.reduce((s, p) => s + Number(p.totalAmount), 0)
    const totalDespesas = expenses.reduce((s, e) => s + Number(e.amount), 0)
    const saldo = totalReceitas - totalDespesas

    // Receitas pendentes do período
    const pendingPayments = await prisma.payment.aggregate({
      where: {
        rental: { companyId },
        status: { in: ['PENDING', 'OVERDUE'] },
        rental: { startDate: { gte: start, lte: end } },
      },
      _sum: { totalAmount: true },
    })
    const totalPendente = Number(pendingPayments._sum.totalAmount) || 0

    // Receitas por tipo de equipamento
    const byEquipmentType = {}
    payments.forEach(p => {
      p.rental?.items?.forEach(item => {
        const type = item.equipment?.type || 'OTHER'
        if (!byEquipmentType[type]) byEquipmentType[type] = 0
        byEquipmentType[type] += Number(item.totalAmount)
      })
    })

    // Despesas por categoria
    const byCategory = {}
    expenses.forEach(e => {
      const cat = CATEGORIES[e.category] || e.category
      if (!byCategory[cat]) byCategory[cat] = 0
      byCategory[cat] += Number(e.amount)
    })

    // Gráfico 6 meses
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      }
    })

    const chartData = months.map(({ key, label }) => {
      const receita = allPayments
        .filter(p => p.paidAt?.toISOString().startsWith(key))
        .reduce((s, p) => s + Number(p.totalAmount), 0)
      const despesa = allExpenses
        .filter(e => e.paidAt?.toISOString().startsWith(key))
        .reduce((s, e) => s + Number(e.amount), 0)
      return { label, receita, despesa, saldo: receita - despesa }
    })

    // Período anterior para comparativo
    const prevStart = new Date(start)
    prevStart.setMonth(prevStart.getMonth() - 1)
    const prevEnd = new Date(end)
    prevEnd.setMonth(prevEnd.getMonth() - 1)

    const [prevPayments, prevExpenses] = await Promise.all([
      prisma.payment.aggregate({
        where: { rental: { companyId }, status: 'PAID', paidAt: { gte: prevStart, lte: prevEnd } },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { companyId, paidAt: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true },
      }),
    ])

    const prevReceitas = Number(prevPayments._sum.totalAmount) || 0
    const prevDespesas = Number(prevExpenses._sum.amount) || 0

    const pctReceitas = prevReceitas > 0 ? ((totalReceitas - prevReceitas) / prevReceitas * 100).toFixed(1) : null
    const pctDespesas = prevDespesas > 0 ? ((totalDespesas - prevDespesas) / prevDespesas * 100).toFixed(1) : null

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      totalReceitas,
      totalDespesas,
      saldo,
      totalPendente,
      pctReceitas,
      pctDespesas,
      byEquipmentType,
      byCategory,
      chartData,
      recentExpenses: expenses.slice(0, 10),
      recentPayments: payments.slice(0, 10),
    }
  }
}

module.exports = new ExpenseService()

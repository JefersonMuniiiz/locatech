const prisma = require('../config/database')
const equipmentService = require('./equipmentService')
const notificationService = require('./notificationService')

const FINE_RATE_PER_DAY = parseFloat(process.env.FINE_RATE_PER_DAY || 50);

class RentalService {
  async findAll(companyId, { status, clientId, startDate, endDate } = {}) {
    await this._updateDelayedRentals(companyId);

    return prisma.rental.findMany({
      where: {
        companyId,
        ...(status && { status }),
        ...(clientId && { clientId }),
        ...(startDate && endDate && {
          startDate: { gte: new Date(startDate), lte: new Date(endDate) },
        }),
      },
      include: {
        client: true,
        items: { include: { equipment: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id, companyId) {
    const rental = await prisma.rental.findFirst({
      where: { id, companyId },
      include: {
        client: true,
        items: { include: { equipment: true } },
        payment: true,
      },
    });
    if (!rental) throw { status: 404, message: 'Locação não encontrada' };
    return rental;
  }

  async create(companyId, { clientId, startDate, endDate, items, address, notes }) {
    const start = new Date(startDate + 'T12:00:00')
    const end = new Date(endDate + 'T12:00:00')
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (totalDays <= 0) throw { status: 400, message: 'Data de fim deve ser após a data de início' };

    // Verify client
    const client = await prisma.client.findFirst({ where: { id: clientId, companyId } });
    if (!client) throw { status: 404, message: 'Cliente não encontrado' };

    // Calculate totals and verify availability
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const equipment = await prisma.equipment.findFirst({
        where: { id: item.equipmentId, companyId },
      });
      if (!equipment) throw { status: 404, message: `Equipamento não encontrado` };
      if (equipment.availableQuantity < item.quantity) {
        throw { status: 400, message: `Quantidade insuficiente para ${equipment.name}. Disponível: ${equipment.availableQuantity}` };
      }

      const itemTotal = item.quantity * equipment.dailyRate * totalDays;
      totalAmount += itemTotal;

      processedItems.push({
        equipmentId: item.equipmentId,
        quantity: item.quantity,
        dailyRate: equipment.dailyRate,
        totalAmount: itemTotal,
      });
    }

    // Create rental in transaction
    return prisma.$transaction(async (tx) => {
      const rental = await tx.rental.create({
        data: {
          clientId,
          companyId,
          startDate: start,
          endDate: end,
          totalDays,
          totalAmount,
          status: 'ACTIVE',
          address,
          notes,
          items: { create: processedItems },
          payment: {
            create: {
              amount: totalAmount,
              fineAmount: 0,
              totalAmount,
              status: 'PENDING',
            },
          },
        },
        include: { client: true, items: { include: { equipment: true } }, payment: true },
      });

      // Update equipment availability
      for (const item of processedItems) {
        await equipmentService.updateAvailability(item.equipmentId, -item.quantity, tx);
      }

      return rental;
    });

    // Notificação WhatsApp (não bloqueia a resposta)
    if (process.env.EVOLUTION_API_URL) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      notificationService.notifyNovaLocacao(result, company).catch(() => {});
    }

    return result;
  }

  async complete(id, companyId) {
    const rental = await this.findById(id, companyId);
    if (rental.status === 'COMPLETED') throw { status: 400, message: 'Locação já finalizada' };
    if (rental.status === 'CANCELLED') throw { status: 400, message: 'Locação cancelada' };

    const returnDate = new Date();
    const fineAmount = this._calculateFine(rental.endDate, returnDate, rental.totalAmount);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.rental.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          returnDate,
          fineAmount,
        },
      });

      // Update payment if there's a fine
      if (fineAmount > 0 && rental.payment) {
        await tx.payment.update({
          where: { id: rental.payment.id },
          data: {
            fineAmount,
            totalAmount: parseFloat(rental.payment.amount) + fineAmount,
            status: rental.payment.status === 'PAID' ? 'PAID' : 'PENDING',
          },
        });
      }

      // Restore equipment availability
      for (const item of rental.items) {
        await equipmentService.updateAvailability(item.equipmentId, item.quantity, tx);
      }

      return updated;
    });
  }

  async updatePayment(rentalId, companyId, { status, method, notes }) {
    const rental = await this.findById(rentalId, companyId);
    if (!rental.payment) throw { status: 404, message: 'Pagamento não encontrado' };

    return prisma.payment.update({
      where: { id: rental.payment.id },
      data: {
        status,
        method,
        notes,
        paidAt: status === 'PAID' ? new Date() : null,
      },
    });
  }

  async getTodayDeliveries(companyId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.rental.findMany({
      where: {
        companyId,
        startDate: { gte: today, lt: tomorrow },
        status: { in: ['ACTIVE'] },
      },
      include: { client: true, items: { include: { equipment: true } } },
    });
  }

  async getDashboardStats(companyId) {
    await this._updateDelayedRentals(companyId);

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalEquipments,
      rentedEquipments,
      activeRentals,
      delayedRentals,
      monthRevenue,
      recentRentals,
    ] = await Promise.all([
      prisma.equipment.count({ where: { companyId } }),
      prisma.equipment.aggregate({
        where: { companyId },
        _sum: { availableQuantity: true, totalQuantity: true },
      }),
      prisma.rental.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.rental.findMany({
        where: { companyId, status: 'DELAYED' },
        include: { client: true, payment: true },
        take: 5,
      }),
      prisma.payment.aggregate({
        where: {
          rental: { companyId },
          status: 'PAID',
          paidAt: { gte: firstDay, lte: lastDay },
        },
        _sum: { totalAmount: true },
      }),
      prisma.rental.findMany({
        where: { companyId },
        include: { client: true, items: true, payment: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const totalItems = rentedEquipments._sum.totalQuantity || 0;
    const availableItems = rentedEquipments._sum.availableQuantity || 0;

    return {
      totalEquipments,
      rentedEquipments: totalItems - availableItems,
      availableEquipments: availableItems,
      activeRentals,
      delayedCount: delayedRentals.length,
      delayedRentals,
      monthRevenue: monthRevenue._sum.totalAmount || 0,
      recentRentals,
    };
  }

  _calculateFine(endDate, returnDate, totalAmount) {
    const end = new Date(endDate);
    const returned = new Date(returnDate);
    if (returned <= end) return 0;

    const daysLate = Math.ceil((returned - end) / (1000 * 60 * 60 * 24));
    return daysLate * FINE_RATE_PER_DAY;
  }

  async _updateDelayedRentals(companyId) {
    const now = new Date();
    await prisma.rental.updateMany({
      where: {
        companyId,
        status: 'ACTIVE',
        endDate: { lt: now },
      },
      data: { status: 'DELAYED' },
    });
  }
}

module.exports = new RentalService();

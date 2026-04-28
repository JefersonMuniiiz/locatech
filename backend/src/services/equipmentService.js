const prisma = require('../config/database');

class EquipmentService {
  async findAll(companyId, { type, status, search } = {}) {
    const where = {
      companyId,
      ...(type && { type }),
      ...(status && { status }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    return prisma.equipment.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id, companyId) {
    const equipment = await prisma.equipment.findFirst({
      where: { id, companyId },
      include: {
        rentalItems: {
          include: { rental: { include: { client: true } } },
          where: { rental: { status: 'ACTIVE' } },
        },
      },
    });
    if (!equipment) throw { status: 404, message: 'Equipamento não encontrado' };
    return equipment;
  }

  async create(companyId, data) {
    return prisma.equipment.create({
      data: { ...data, companyId, availableQuantity: data.totalQuantity },
    });
  }

  async update(id, companyId, data) {
    await this.findById(id, companyId);
    return prisma.equipment.update({ where: { id }, data });
  }

  async delete(id, companyId) {
    const equipment = await this.findById(id, companyId);
    const activeRentals = await prisma.rentalItem.count({
      where: { equipmentId: id, rental: { status: 'ACTIVE' } },
    });
    if (activeRentals > 0) throw { status: 400, message: 'Equipamento possui locações ativas' };
    return prisma.equipment.delete({ where: { id } });
  }

  async updateAvailability(equipmentId, quantityChange, tx = prisma) {
    const equipment = await tx.equipment.findUnique({ where: { id: equipmentId } });
    if (!equipment) throw { status: 404, message: 'Equipamento não encontrado' };

    const newAvailable = equipment.availableQuantity + quantityChange;
    if (newAvailable < 0) throw { status: 400, message: `Quantidade insuficiente para ${equipment.name}` };

    const newStatus = newAvailable === 0 ? 'RENTED' : 'AVAILABLE';

    return tx.equipment.update({
      where: { id: equipmentId },
      data: { availableQuantity: newAvailable, status: newStatus },
    });
  }
}

module.exports = new EquipmentService();

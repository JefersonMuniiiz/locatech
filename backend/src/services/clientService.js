const prisma = require('../config/database');

class ClientService {
  async findAll(companyId, { search } = {}) {
    return prisma.client.findMany({
      where: {
        companyId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { document: { contains: search } },
            { phone: { contains: search } },
          ],
        }),
      },
      include: {
        _count: { select: { rentals: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id, companyId) {
    const client = await prisma.client.findFirst({
      where: { id, companyId },
      include: {
        rentals: {
          include: { items: { include: { equipment: true } }, payment: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!client) throw { status: 404, message: 'Cliente não encontrado' };
    return client;
  }

  async create(companyId, data) {
    return prisma.client.create({ data: { ...data, companyId } });
  }

  async update(id, companyId, data) {
    await this.findById(id, companyId);
    return prisma.client.update({ where: { id }, data });
  }

  async delete(id, companyId) {
    await this.findById(id, companyId);
    const activeRentals = await prisma.rental.count({
      where: { clientId: id, status: 'ACTIVE' },
    });
    if (activeRentals > 0) throw { status: 400, message: 'Cliente possui locações ativas' };
    return prisma.client.delete({ where: { id } });
  }
}

module.exports = new ClientService();

const bcrypt = require('bcryptjs');
const prisma = require('../config/database');

class UserService {
  async findAll(companyId) {
    return prisma.user.findMany({
      where: { companyId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(companyId, { name, email, password, role }) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw { status: 409, message: 'E-mail já cadastrado' };

    const hashed = await bcrypt.hash(password, 12);
    return prisma.user.create({
      data: { name, email, password: hashed, role, companyId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  async update(id, companyId, { name, email, password, role }) {
    const user = await prisma.user.findFirst({ where: { id, companyId } });
    if (!user) throw { status: 404, message: 'Usuário não encontrado' };

    const data = { name, email, role };
    if (password && password.length >= 6) {
      data.password = await bcrypt.hash(password, 12);
    }

    return prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  async delete(id, companyId, requesterId) {
    if (id === requesterId) throw { status: 400, message: 'Você não pode remover sua própria conta' };
    const user = await prisma.user.findFirst({ where: { id, companyId } });
    if (!user) throw { status: 404, message: 'Usuário não encontrado' };
    return prisma.user.delete({ where: { id } });
  }
}

module.exports = new UserService();

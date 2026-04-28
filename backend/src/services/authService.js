const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

class AuthService {
  async register({ companyName, companyDocument, companyEmail, companyPhone, userName, userEmail, password }) {
    const existingCompany = await prisma.company.findUnique({ where: { email: companyEmail } });
    if (existingCompany) throw { status: 409, message: 'Empresa já cadastrada com este e-mail' };

    const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
    if (existingUser) throw { status: 409, message: 'Usuário já cadastrado com este e-mail' };

    const hashedPassword = await bcrypt.hash(password, 12);

    const company = await prisma.company.create({
      data: {
        name: companyName,
        document: companyDocument,
        email: companyEmail,
        phone: companyPhone,
        users: {
          create: {
            name: userName,
            email: userEmail,
            password: hashedPassword,
            role: 'ADMIN',
          },
        },
      },
      include: { users: true },
    });

    const user = company.users[0];
    const token = this._generateToken(user.id);

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      company: { id: company.id, name: company.name },
    };
  }

  async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) throw { status: 401, message: 'Credenciais inválidas' };

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw { status: 401, message: 'Credenciais inválidas' };

    const token = this._generateToken(user.id);

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      company: { id: user.company.id, name: user.company.name },
    };
  }

  _generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }
}

module.exports = new AuthService();

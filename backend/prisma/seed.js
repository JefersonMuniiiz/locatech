const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create company
  const company = await prisma.company.upsert({
    where: { email: 'admin@locatech.com.br' },
    update: {},
    create: {
      name: 'LocaTech Equipamentos',
      document: '12.345.678/0001-90',
      email: 'admin@locatech.com.br',
      phone: '(71) 9 9999-0000',
      address: 'Rua das Indústrias, 100 - Salvador, BA',
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@locatech.com.br' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@locatech.com.br',
      password: hashedPassword,
      role: 'ADMIN',
      companyId: company.id,
    },
  });

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Construtora Silva & Filhos',
        phone: '(71) 3333-1111',
        document: '98.765.432/0001-10',
        email: 'contato@silvafilhos.com.br',
        address: 'Av. Paralela, 500',
        city: 'Salvador',
        state: 'BA',
        zipCode: '41720-000',
        companyId: company.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'João Carlos Ferreira',
        phone: '(71) 9 8888-2222',
        document: '123.456.789-00',
        address: 'Rua do Comércio, 25',
        city: 'Camaçari',
        state: 'BA',
        zipCode: '42800-000',
        companyId: company.id,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Reformas Nordeste LTDA',
        phone: '(71) 3444-5555',
        document: '55.444.333/0001-22',
        email: 'obras@reformasnordeste.com.br',
        address: 'Rod. BA-093, km 12',
        city: 'Dias d\'Ávila',
        state: 'BA',
        zipCode: '43700-000',
        companyId: company.id,
      },
    }),
  ]);

  // Create equipments
  const equipments = await Promise.all([
    prisma.equipment.create({
      data: {
        name: 'Andaime Fachadeiro',
        type: 'SCAFFOLD',
        totalQuantity: 100,
        availableQuantity: 70,
        dailyRate: 8.50,
        status: 'AVAILABLE',
        description: 'Andaime tubular fachadeiro 1,5m x 1,0m',
        companyId: company.id,
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Escora Metálica 3m',
        type: 'PROP',
        totalQuantity: 50,
        availableQuantity: 35,
        dailyRate: 4.00,
        status: 'AVAILABLE',
        description: 'Escora metálica regulável até 3 metros',
        companyId: company.id,
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Betoneira 400L',
        type: 'CONCRETE_MIXER',
        totalQuantity: 8,
        availableQuantity: 5,
        dailyRate: 120.00,
        status: 'AVAILABLE',
        description: 'Betoneira elétrica 400 litros',
        companyId: company.id,
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Compactador de Solo',
        type: 'MACHINE',
        totalQuantity: 4,
        availableQuantity: 3,
        dailyRate: 180.00,
        status: 'AVAILABLE',
        description: 'Compactador tipo sapo',
        companyId: company.id,
      },
    }),
    prisma.equipment.create({
      data: {
        name: 'Andaime Multidirecional',
        type: 'SCAFFOLD',
        totalQuantity: 60,
        availableQuantity: 20,
        dailyRate: 12.00,
        status: 'AVAILABLE',
        description: 'Sistema multidirecional com acessórios',
        companyId: company.id,
      },
    }),
  ]);

  // Create a rental
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 5);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 10);

  const rental = await prisma.rental.create({
    data: {
      clientId: clients[0].id,
      companyId: company.id,
      startDate,
      endDate,
      totalDays: 15,
      totalAmount: 3825.00,
      status: 'ACTIVE',
      address: 'Av. Paralela, 500 - Salvador, BA',
      notes: 'Obra de fachada - 4 andares',
      items: {
        create: [
          {
            equipmentId: equipments[0].id,
            quantity: 30,
            dailyRate: 8.50,
            totalAmount: 3825.00,
          },
        ],
      },
      payment: {
        create: {
          amount: 3825.00,
          fineAmount: 0,
          totalAmount: 3825.00,
          status: 'PENDING',
        },
      },
    },
  });

  // Create a delayed rental
  const delayedStart = new Date();
  delayedStart.setDate(delayedStart.getDate() - 20);
  const delayedEnd = new Date();
  delayedEnd.setDate(delayedEnd.getDate() - 5);

  await prisma.rental.create({
    data: {
      clientId: clients[1].id,
      companyId: company.id,
      startDate: delayedStart,
      endDate: delayedEnd,
      totalDays: 15,
      totalAmount: 1800.00,
      fineAmount: 600.00,
      status: 'DELAYED',
      address: 'Rua do Comércio, 25 - Camaçari, BA',
      items: {
        create: [
          {
            equipmentId: equipments[2].id,
            quantity: 1,
            dailyRate: 120.00,
            totalAmount: 1800.00,
          },
        ],
      },
      payment: {
        create: {
          amount: 1800.00,
          fineAmount: 600.00,
          totalAmount: 2400.00,
          status: 'OVERDUE',
        },
      },
    },
  });

  console.log('✅ Seed completed!');
  console.log('📧 Login: admin@locatech.com.br');
  console.log('🔑 Password: admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

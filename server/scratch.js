import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.storeSettings.findFirst().then(s => console.log(JSON.stringify(s.paymentMethods, null, 2))).finally(() => prisma.$disconnect());

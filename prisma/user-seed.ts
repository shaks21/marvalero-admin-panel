import { PrismaClient } from "../src/generated/prisma/client.js";
// import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import * as bcrypt from "bcrypt";

dotenv.config();

console.log("Seeding started...");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
  log: ["query", "error", "warn"],
});

async function main() {
  console.log('🌱 Seeding database...');

  /**
   * Clear existing data (dev only)
   */
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  /**
   * Admin user
   */
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '+1000000000',
      userType: 'ADMIN',
      status: 'ACTIVE',
      lastLoginAt: new Date(),
    },
  });

  /**
   * Regular users
   */
  const users = await prisma.user.createMany({
    data: [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+123456789',
        userType: 'USER',
        status: 'ACTIVE',
        lastLoginAt: new Date('2026-01-10'),
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+987654321',
        userType: 'USER',
        status: 'SUSPENDED',
        lastLoginAt: new Date('2025-12-20'),
      },
    ],
  });

  /**
   * Business users with linked businesses
   */
  const businessUsers = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Ahmed Ali',
        email: 'ahmed@acme.com',
        phone: '+966500000001',
        userType: 'BUSINESS',
        status: 'ACTIVE',
        lastLoginAt: new Date('2026-01-12'),
        business: {
          create: {
            name: 'Acme Trading LLC',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sarah Khan',
        email: 'sarah@techflow.io',
        phone: '+971500000002',
        userType: 'BUSINESS',
        status: 'ACTIVE',
        lastLoginAt: new Date('2026-01-14'),
        business: {
          create: {
            name: 'TechFlow Solutions',
          },
        },
      },
    }),
  ]);

  console.log('✅ Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

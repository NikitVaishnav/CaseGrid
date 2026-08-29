// ============================================================
// CaseGrid — Database Seed Script
// Creates default users (one per role) for demo purposes
// Run: npm run db:seed
// ============================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Default password for all seed users (change in production!)
const DEFAULT_PASSWORD = 'casegrid123';

/**
 * Seed users — one for each RBAC role so you can demo all perspectives
 */
const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@casegrid.gov.in',
    role: 'ADMIN',
    department: 'IT Administration',
    badgeNumber: null,
  },
  {
    name: 'Inspector Rajesh Kumar',
    email: 'rajesh.kumar@police.gov.in',
    role: 'INVESTIGATING_OFFICER',
    department: 'Mumbai Crime Branch',
    badgeNumber: 'MCB-2024-1847',
  },
  {
    name: 'Advocate Priya Sharma',
    email: 'priya.sharma@legal.gov.in',
    role: 'LEGAL_OFFICER',
    department: 'Public Prosecution',
    badgeNumber: null,
  },
  {
    name: 'Justice Anil Deshmukh',
    email: 'anil.deshmukh@judiciary.gov.in',
    role: 'JUDGE',
    department: 'Sessions Court, Mumbai',
    badgeNumber: null,
  },
];

async function main() {
  console.log('🌱 Seeding CaseGrid database...\n');

  // Hash the default password once (bcrypt is slow by design)
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  for (const user of seedUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existing) {
      console.log(`  ⏭️  User already exists: ${user.email} (${user.role})`);
      continue;
    }

    const created = await prisma.user.create({
      data: {
        ...user,
        passwordHash,
      },
    });

    console.log(`  ✅ Created: ${created.name} <${created.email}> [${created.role}]`);
  }

  console.log('\n🎉 Seed complete!');
  console.log(`\n📋 Login credentials for all users:`);
  console.log(`   Password: ${DEFAULT_PASSWORD}`);
  seedUsers.forEach((u) => {
    console.log(`   ${u.role.padEnd(24)} → ${u.email}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

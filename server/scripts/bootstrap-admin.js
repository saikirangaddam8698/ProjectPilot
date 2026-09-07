/**
 * ProjectPilot Production Admin Bootstrap Script
 * Provisions the initial Workspace Administrator on a fresh production database.
 * 
 * Safety Rules:
 * - Only executes if database has 0 registered users.
 * - Reads INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD from process.env.
 * - Never logs sensitive passwords to console.
 */
import { PrismaClient, MemberStatus } from '../src/generated/client/index.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

export async function bootstrapAdmin() {
  console.log('🚀 ProjectPilot Production Admin Bootstrap check...');

  try {
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      console.log(`ℹ️ [SKIP] Database already contains ${userCount} user account(s). Bootstrap process skipped.`);
      return { status: 'SKIPPED', count: userCount };
    }

    const email = (process.env.INITIAL_ADMIN_EMAIL || '').trim();
    const password = (process.env.INITIAL_ADMIN_PASSWORD || '').trim();

    if (!email || !password) {
      console.error('❌ [ERROR] INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD environment variables are required for production admin bootstrap.');
      console.error('   Please configure INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in your environment / .env file.');
      process.exit(1);
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const member = await prisma.member.create({
      data: {
        id: 'm-admin-1',
        name: 'Workspace Admin',
        avatar: 'WA',
        email,
        role: 'Project Admin',
        department: 'Administration',
        status: MemberStatus.ACTIVE,
        skills: ['Workspace Administration', 'Security', 'Agile Operations'],
        capacity: 40
      }
    });

    const user = await prisma.user.create({
      data: {
        id: 'u-admin-1',
        email,
        passwordHash,
        role: 'ADMIN',
        memberId: member.id
      }
    });

    console.log(`✅ [SUCCESS] Initial Workspace Admin created successfully!`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);

    return { status: 'SUCCESS', userId: user.id, email: user.email };
  } catch (error) {
    console.error('❌ [ERROR] Failed to execute admin bootstrap:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run direct execution if called as CLI script
if (process.argv[1]?.includes('bootstrap-admin.js')) {
  bootstrapAdmin().catch(() => process.exit(1));
}

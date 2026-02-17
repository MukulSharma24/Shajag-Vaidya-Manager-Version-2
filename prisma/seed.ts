// prisma/seed.ts
//
// PRODUCTION SEED FILE
// This creates ONLY the first admin/owner account.
// All other users (doctors, staff, patients) should be created through the app.
//
// Usage:
//   Development: npx prisma db seed
//   Production:  Run once after initial deployment
//
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting production seed...\n');

    // ── Configuration ──
    // Change these values before running in production!
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@clinic.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password@123';
    const ADMIN_NAME = process.env.ADMIN_NAME || 'Clinic Admin';
    const CLINIC_NAME = process.env.CLINIC_NAME || 'Shajag Vaidya Clinic';

    // ── Hash password ──
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // ── Create or update clinic ──
    const clinic = await prisma.clinic.upsert({
        where: { id: 'default-clinic' },
        update: { name: CLINIC_NAME },
        create: {
            id: 'default-clinic',
            name: CLINIC_NAME,
            address: 'Update this address',
            phone: '+91 XXXXXXXXXX',
            email: ADMIN_EMAIL,
        },
    });
    console.log('✅ Clinic created/updated:', clinic.name);

    // ── Create admin/owner user ──
    const existingAdmin = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL.toLowerCase() }
    });

    if (existingAdmin) {
        console.log('⚠️  Admin user already exists:', ADMIN_EMAIL);
        console.log('   Skipping creation. Use the app to reset password if needed.');
    } else {
        const admin = await prisma.user.create({
            data: {
                name: ADMIN_NAME,
                email: ADMIN_EMAIL.toLowerCase(),
                password: hashedPassword,
                role: 'OWNER',
                isActive: true,
            },
        });
        console.log('✅ Admin user created:', admin.email);
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  🎉 Seed completed!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Admin Email: ${ADMIN_EMAIL}`);
    if (!existingAdmin) {
        console.log(`  Admin Password: ${ADMIN_PASSWORD}`);
        console.log('\n  ⚠️  IMPORTANT: Change this password immediately after first login!');
    }
    console.log('═══════════════════════════════════════════════════\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
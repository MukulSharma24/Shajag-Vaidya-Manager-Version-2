const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@clinic.com';
    const password = 'password123';

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashedPassword);

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        const updated = await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log('✅ Updated user password:', updated.email);
    } else {
        const created = await prisma.user.create({
            data: {
                name: 'Admin',
                email,
                password: hashedPassword
            }
        });
        console.log('✅ Created new user:', created.email);
    }

    // Verify
    const user = await prisma.user.findUnique({ where: { email } });
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password verification:', isValid ? '✅ PASS' : '❌ FAIL');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
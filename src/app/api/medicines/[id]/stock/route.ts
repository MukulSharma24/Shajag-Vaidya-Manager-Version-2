export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getUserFromToken } from '@/lib/auth';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // ── Get clinicId from auth token ─────────────────────────────────
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        const currentUser = token ? await getUserFromToken(token) : null;

        let clinicId: string | null = null;
        if (currentUser) {
            const staff = await prisma.staff.findFirst({
                where: { userId: (currentUser as any).id },
                select: { clinicId: true },
            });
            clinicId = staff?.clinicId ?? null;

            if (!clinicId) {
                const clinic = await prisma.clinic.findFirst({
                    orderBy: { createdAt: 'asc' },
                    select: { id: true },
                });
                clinicId = clinic?.id ?? null;
            }
        }

        if (!clinicId) {
            return NextResponse.json(
                { error: 'Unauthorized: could not determine clinic' },
                { status: 401 }
            );
        }

        // ── Validate body ────────────────────────────────────────────────
        const body = await request.json();
        const { type, quantity, reason, referenceNumber, notes } = body;

        if (!type || !quantity) {
            return NextResponse.json(
                { error: 'Type and quantity are required' },
                { status: 400 }
            );
        }

        const quantityNum = parseInt(quantity);

        // ── Get current medicine ─────────────────────────────────────────
        const medicine = await prisma.medicine.findUnique({
            where: { id: params.id },
        });

        if (!medicine) {
            return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
        }

        // ── Calculate new stock ──────────────────────────────────────────
        let newStock = medicine.currentStock;
        let transactionQuantity = quantityNum;

        if (type === 'IN') {
            newStock += quantityNum;
        } else if (type === 'OUT') {
            if (medicine.currentStock < quantityNum) {
                return NextResponse.json(
                    { error: 'Insufficient stock' },
                    { status: 400 }
                );
            }
            newStock -= quantityNum;
            transactionQuantity = -quantityNum;
        } else if (type === 'ADJUSTMENT') {
            newStock = quantityNum;
            transactionQuantity = quantityNum - medicine.currentStock;
        }

        // ── Update medicine stock ────────────────────────────────────────
        const updatedMedicine = await prisma.medicine.update({
            where: { id: params.id },
            data: { currentStock: newStock },
        });

        // ── Create transaction record (cast as any until prisma generate runs) ──
        await (prisma.stockTransaction.create as any)({
            data: {
                medicineId: params.id,
                type,
                quantity: transactionQuantity,
                balanceAfter: newStock,
                reason: reason || type,
                referenceNumber: referenceNumber || null,
                notes: notes || null,
                clinicId,
            },
        });

        return NextResponse.json(updatedMedicine);

    } catch (error) {
        console.error('Error adjusting stock:', error);
        return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 });
    }
}
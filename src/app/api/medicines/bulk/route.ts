export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getUserFromToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
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

        const body = await request.json();
        const { medicines } = body;

        if (!Array.isArray(medicines) || medicines.length === 0) {
            return NextResponse.json(
                { error: 'No medicines provided' },
                { status: 400 }
            );
        }

        const results = {
            success: [] as any[],
            failed: [] as any[],
        };

        for (const med of medicines) {
            try {
                // cast as any until `npx prisma generate` runs locally to refresh types
                const medicine = await (prisma.medicine.create as any)({
                    data: {
                        name: med.name,
                        genericName: med.genericName || null,
                        manufacturer: med.manufacturer || null,
                        type: med.type,
                        strength: med.strength || null,
                        unit: med.unit || 'pcs',
                        description: med.description || null,
                        currentStock: parseInt(med.currentStock) || 0,
                        reorderLevel: parseInt(med.reorderLevel) || 10,
                        purchasePrice: parseFloat(med.purchasePrice) || 0,
                        sellingPrice: parseFloat(med.sellingPrice) || 0,
                        mrp: parseFloat(med.mrp) || 0,
                        batchNumber: med.batchNumber || null,
                        expiryDate: med.expiryDate ? new Date(med.expiryDate) : null,
                        barcode: med.barcode || null,
                        clinicId,
                    },
                });

                if (med.categoryIds && Array.isArray(med.categoryIds) && med.categoryIds.length > 0) {
                    await prisma.medicineCategory.createMany({
                        data: med.categoryIds.map((categoryId: string) => ({
                            medicineId: medicine.id,
                            categoryId,
                        })),
                        skipDuplicates: true,
                    });
                }

                if (medicine.currentStock > 0) {
                    await (prisma.stockTransaction.create as any)({
                        data: {
                            medicineId: medicine.id,
                            type: 'IN',
                            quantity: medicine.currentStock,
                            balanceAfter: medicine.currentStock,
                            reason: 'Bulk Upload - Initial Stock',
                            clinicId,
                        },
                    });
                }

                results.success.push({ name: med.name, id: medicine.id });
            } catch (error: any) {
                console.error(`Failed to create medicine: ${med.name}`, error);
                results.failed.push({ name: med.name, error: error.message || 'Unknown error' });
            }
        }

        return NextResponse.json({
            message: `Successfully created ${results.success.length} medicines`,
            success: results.success,
            failed: results.failed,
            total: medicines.length,
        });

    } catch (error) {
        console.error('Error in bulk upload:', error);
        return NextResponse.json({ error: 'Failed to process bulk upload' }, { status: 500 });
    }
}
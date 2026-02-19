export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, getTokenFromCookieString } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        const clinicId = payload?.clinicId;
        if (!clinicId) return NextResponse.json({ error: 'Unauthorized: could not determine clinic' }, { status: 401 });

        const { medicines } = await request.json();
        if (!Array.isArray(medicines) || medicines.length === 0)
            return NextResponse.json({ error: 'No medicines provided' }, { status: 400 });

        const results = { success: [] as any[], failed: [] as any[] };

        for (const med of medicines) {
            try {
                const medicine = await prisma.medicine.create({
                    data: {
                        clinicId,
                        name: med.name, genericName: med.genericName || null,
                        manufacturer: med.manufacturer || null, type: med.type || 'TABLET',
                        strength: med.strength || null, unit: med.unit || 'pcs',
                        description: med.description || null,
                        currentStock: parseInt(med.currentStock) || 0,
                        reorderLevel: parseInt(med.reorderLevel) || 10,
                        purchasePrice: parseFloat(med.purchasePrice) || 0,
                        sellingPrice: parseFloat(med.sellingPrice) || 0,
                        mrp: parseFloat(med.mrp) || 0, batchNumber: med.batchNumber || null,
                        expiryDate: med.expiryDate ? new Date(med.expiryDate) : null,
                        barcode: med.barcode && String(med.barcode).trim() !== '' ? String(med.barcode).trim() : null,
                    },
                });

                if (med.categoryIds?.length > 0) {
                    await prisma.medicineCategory.createMany({
                        data: med.categoryIds.map((categoryId: string) => ({ medicineId: medicine.id, categoryId })),
                        skipDuplicates: true,
                    });
                }

                if (medicine.currentStock > 0) {
                    await prisma.stockTransaction.create({
                        data: { clinicId, medicineId: medicine.id, type: 'IN',
                            quantity: medicine.currentStock, balanceAfter: medicine.currentStock,
                            reason: 'Bulk Upload - Initial Stock' },
                    });
                }

                results.success.push({ name: med.name, id: medicine.id });
            } catch (error: any) {
                let friendlyError = error.message;
                if (error.code === 'P2002') friendlyError = `Duplicate ${error.meta?.target?.[0]} — already exists`;
                results.failed.push({ name: med.name, error: friendlyError });
            }
        }

        return NextResponse.json({
            message: `Successfully created ${results.success.length} of ${medicines.length} medicines`,
            success: results.success, failed: results.failed, total: medicines.length,
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process bulk upload' }, { status: 500 });
    }
}

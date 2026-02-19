export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, getTokenFromCookieString } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // ✅ Use same auth pattern as all other routes
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);

        // ✅ clinicId directly from JWT — no extra DB lookups needed
        const clinicId = payload?.clinicId;
        if (!clinicId) {
            return NextResponse.json(
                { error: 'Unauthorized: could not determine clinic' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { medicines } = body;

        if (!Array.isArray(medicines) || medicines.length === 0) {
            return NextResponse.json({ error: 'No medicines provided' }, { status: 400 });
        }

        const results = {
            success: [] as any[],
            failed: [] as any[],
        };

        for (const med of medicines) {
            try {
                // ✅ No more `as any` cast — types are correct now after prisma generate
                const medicine = await prisma.medicine.create({
                    data: {
                        clinicId, // ✅ Always from JWT
                        name: med.name,
                        genericName: med.genericName || null,
                        manufacturer: med.manufacturer || null,
                        type: med.type || 'TABLET',
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
                        // ✅ Properly handle empty/whitespace barcodes — don't send "" to unique field
                        barcode: med.barcode && String(med.barcode).trim() !== '' ? String(med.barcode).trim() : null,
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
                    await prisma.stockTransaction.create({
                        data: {
                            clinicId, // ✅ Always from JWT
                            medicineId: medicine.id,
                            type: 'IN',
                            quantity: medicine.currentStock,
                            balanceAfter: medicine.currentStock,
                            reason: 'Bulk Upload - Initial Stock',
                        },
                    });
                }

                results.success.push({ name: med.name, id: medicine.id });
            } catch (error: any) {
                console.error(`Failed to create medicine: ${med.name}`, error.message);

                // ✅ Better error messages to help debug CSV issues
                let friendlyError = error.message;
                if (error.code === 'P2002') {
                    const field = error.meta?.target?.[0] || 'field';
                    friendlyError = `Duplicate ${field} — already exists in this clinic`;
                } else if (error.code === 'P2000') {
                    friendlyError = `Value too long for one of the fields`;
                }

                results.failed.push({ name: med.name, error: friendlyError });
            }
        }

        return NextResponse.json({
            message: `Successfully created ${results.success.length} of ${medicines.length} medicines`,
            success: results.success,
            failed: results.failed,
            total: medicines.length,
        });

    } catch (error) {
        console.error('Error in bulk upload:', error);
        return NextResponse.json({ error: 'Failed to process bulk upload' }, { status: 500 });
    }
}
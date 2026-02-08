// src/app/api/medicines/bulk/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Bulk create medicines from CSV/Excel upload
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { medicines } = body; // Array of medicine objects

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

        // Process each medicine
        for (const med of medicines) {
            try {
                // Create medicine
                const medicine = await prisma.medicine.create({
                    data: {
                        name: med.name,
                        genericName: med.genericName || null,
                        manufacturer: med.manufacturer || null,
                        type: med.type,
                        strength: med.strength || null,
                        unit: med.unit,
                        description: med.description || null,
                        currentStock: parseInt(med.currentStock) || 0,
                        reorderLevel: parseInt(med.reorderLevel) || 10,
                        purchasePrice: parseFloat(med.purchasePrice) || 0,
                        sellingPrice: parseFloat(med.sellingPrice) || 0,
                        mrp: parseFloat(med.mrp) || 0,
                        batchNumber: med.batchNumber || null,
                        expiryDate: med.expiryDate ? new Date(med.expiryDate) : null,
                        barcode: med.barcode || null,
                    },
                });

                // Add categories if provided
                if (med.categoryIds && Array.isArray(med.categoryIds) && med.categoryIds.length > 0) {
                    await prisma.medicineCategory.createMany({
                        data: med.categoryIds.map((categoryId: string) => ({
                            medicineId: medicine.id,
                            categoryId,
                        })),
                        skipDuplicates: true,
                    });
                }

                // Create initial stock transaction if stock > 0
                if (medicine.currentStock > 0) {
                    await prisma.stockTransaction.create({
                        data: {
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
                console.error(`Failed to create medicine: ${med.name}`, error);
                results.failed.push({
                    name: med.name,
                    error: error.message || 'Unknown error'
                });
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
        return NextResponse.json(
            { error: 'Failed to process bulk upload' },
            { status: 500 }
        );
    }
}
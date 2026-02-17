// src/app/api/medicines/by-category/[categoryId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { categoryId: string } }
) {
    try {
        const { categoryId } = params;

        if (!categoryId) {
            return NextResponse.json(
                { error: 'Category ID is required' },
                { status: 400 }
            );
        }

        // Get all medicines linked to this category via MedicineCategory junction table
        const medicineCategories = await prisma.medicineCategory.findMany({
            where: {
                categoryId: categoryId,
            },
            include: {
                medicine: {
                    select: {
                        id: true,
                        name: true,
                        genericName: true,
                        manufacturer: true,
                        type: true,
                        strength: true,
                        unit: true,
                        currentStock: true,
                        reorderLevel: true,
                        sellingPrice: true,
                        mrp: true,
                        expiryDate: true,
                    },
                },
            },
        });

        // Transform to return just medicines with stock status
        const medicines = medicineCategories.map((mc) => {
            const med = mc.medicine;
            const stockStatus = med.currentStock > med.reorderLevel
                ? 'IN_STOCK'
                : med.currentStock > 0
                    ? 'LOW_STOCK'
                    : 'OUT_OF_STOCK';

            return {
                id: med.id,
                name: med.name,
                genericName: med.genericName,
                manufacturer: med.manufacturer,
                type: med.type,
                strength: med.strength,
                unit: med.unit,
                currentStock: med.currentStock,
                reorderLevel: med.reorderLevel,
                sellingPrice: med.sellingPrice,
                mrp: med.mrp,
                expiryDate: med.expiryDate,
                stockStatus,
                stockLabel: stockStatus === 'IN_STOCK'
                    ? `${med.currentStock} in stock`
                    : stockStatus === 'LOW_STOCK'
                        ? `Low: ${med.currentStock}`
                        : 'Out of stock',
                available: med.currentStock > 0,
            };
        });

        return NextResponse.json({ medicines });
    } catch (error) {
        console.error('Error fetching medicines by category:', error);
        return NextResponse.json(
            { error: 'Failed to fetch medicines' },
            { status: 500 }
        );
    }
}
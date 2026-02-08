// src/app/api/medicines/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// ============================================
// GET /api/medicines/search
// Search medicines for prescription autocomplete
// Phase 2 Feature: Shows stock availability
// ============================================
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!query || query.length < 2) {
            return NextResponse.json({ medicines: [] });
        }

        // Search medicines by name, generic name, or manufacturer
        const medicines = await prisma.medicine.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { genericName: { contains: query, mode: 'insensitive' } },
                    { manufacturer: { contains: query, mode: 'insensitive' } },
                ],
            },
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
                batchNumber: true,
                expiryDate: true,
            },
            orderBy: [
                { currentStock: 'desc' }, // Prioritize items in stock
                { name: 'asc' },
            ],
            take: limit,
        });

        // Format response with stock status
        const formattedMedicines = medicines.map(medicine => ({
            ...medicine,
            stockStatus: getStockStatus(medicine.currentStock, medicine.reorderLevel),
            stockLabel: getStockLabel(medicine.currentStock, medicine.unit),
            available: medicine.currentStock > 0,
        }));

        return NextResponse.json({ medicines: formattedMedicines });

    } catch (error) {
        console.error('Error searching medicines:', error);
        return NextResponse.json(
            { error: 'Failed to search medicines' },
            { status: 500 }
        );
    }
}

// Helper functions
function getStockStatus(currentStock: number, reorderLevel: number): string {
    if (currentStock === 0) return 'OUT_OF_STOCK';
    if (currentStock <= reorderLevel) return 'LOW_STOCK';
    return 'IN_STOCK';
}

function getStockLabel(currentStock: number, unit: string): string {
    if (currentStock === 0) return 'Out of Stock';
    if (currentStock <= 5) return `Only ${currentStock} ${unit} left`;
    return `${currentStock} ${unit} available`;
}
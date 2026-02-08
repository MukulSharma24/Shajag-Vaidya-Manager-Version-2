// src/app/api/medicines/[id]/stock/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Adjust stock (add or remove)
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { type, quantity, reason, referenceNumber, notes } = body;

        // Validate
        if (!type || !quantity) {
            return NextResponse.json(
                { error: 'Type and quantity are required' },
                { status: 400 }
            );
        }

        const quantityNum = parseInt(quantity);

        // Get current medicine
        const medicine = await prisma.medicine.findUnique({
            where: { id: params.id },
        });

        if (!medicine) {
            return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
        }

        // Calculate new stock
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
            transactionQuantity = -quantityNum; // Negative for OUT
        } else if (type === 'ADJUSTMENT') {
            newStock = quantityNum; // Set to exact quantity
            transactionQuantity = quantityNum - medicine.currentStock;
        }

        // Update medicine stock
        const updatedMedicine = await prisma.medicine.update({
            where: { id: params.id },
            data: {
                currentStock: newStock,
            },
        });

        // Create transaction record
        await prisma.stockTransaction.create({
            data: {
                medicineId: params.id,
                type,
                quantity: transactionQuantity,
                balanceAfter: newStock,
                reason: reason || type,
                referenceNumber,
                notes,
            },
        });

        return NextResponse.json(updatedMedicine);
    } catch (error) {
        console.error('Error adjusting stock:', error);
        return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 });
    }
}
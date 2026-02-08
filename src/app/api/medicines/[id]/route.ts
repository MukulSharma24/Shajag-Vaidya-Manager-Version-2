// src/app/api/medicines/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch single medicine
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const medicine = await prisma.medicine.findUnique({
            where: { id: params.id },
            include: {
                categories: {
                    include: {
                        category: true,
                    },
                },
                transactions: {
                    orderBy: {
                        transactionDate: 'desc',
                    },
                    take: 10, // Last 10 transactions
                },
            },
        });

        if (!medicine) {
            return NextResponse.json({ error: 'Medicine not found' }, { status: 404 });
        }

        return NextResponse.json(medicine);
    } catch (error) {
        console.error('Error fetching medicine:', error);
        return NextResponse.json({ error: 'Failed to fetch medicine' }, { status: 500 });
    }
}

// PUT: Update medicine
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const {
            name,
            genericName,
            manufacturer,
            type,
            strength,
            unit,
            description,
            reorderLevel,
            purchasePrice,
            sellingPrice,
            mrp,
            batchNumber,
            expiryDate,
            barcode,
            categoryIds,
        } = body;

        // Update medicine
        const medicine = await prisma.medicine.update({
            where: { id: params.id },
            data: {
                name,
                genericName,
                manufacturer,
                type,
                strength,
                unit,
                description,
                reorderLevel: parseInt(reorderLevel) || 10,
                purchasePrice: parseFloat(purchasePrice) || 0,
                sellingPrice: parseFloat(sellingPrice) || 0,
                mrp: parseFloat(mrp) || 0,
                batchNumber,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                barcode,
            },
        });

        // Update categories
        if (categoryIds) {
            // Delete existing categories
            await prisma.medicineCategory.deleteMany({
                where: { medicineId: params.id },
            });

            // Add new categories
            if (categoryIds.length > 0) {
                await prisma.medicineCategory.createMany({
                    data: categoryIds.map((categoryId: string) => ({
                        medicineId: params.id,
                        categoryId,
                    })),
                });
            }
        }

        return NextResponse.json(medicine);
    } catch (error) {
        console.error('Error updating medicine:', error);
        return NextResponse.json({ error: 'Failed to update medicine' }, { status: 500 });
    }
}

// DELETE: Delete medicine
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.medicine.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: 'Medicine deleted successfully' });
    } catch (error) {
        console.error('Error deleting medicine:', error);
        return NextResponse.json({ error: 'Failed to delete medicine' }, { status: 500 });
    }
}
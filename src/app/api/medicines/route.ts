// src/app/api/medicines/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all medicines with filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || '';
        const categoryId = searchParams.get('categoryId') || '';
        const stockStatus = searchParams.get('stockStatus') || 'all'; // all, low, out

        const where: any = {};

        // Search filter
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { genericName: { contains: search, mode: 'insensitive' } },
                { manufacturer: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Type filter
        if (type) {
            where.type = type;
        }

        // Category filter
        if (categoryId) {
            where.categories = {
                some: {
                    categoryId: categoryId,
                },
            };
        }

        // Fetch medicines
        let medicines = await prisma.medicine.findMany({
            where,
            include: {
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Stock status filter (applied after fetching)
        if (stockStatus === 'low') {
            medicines = medicines.filter(m => m.currentStock > 0 && m.currentStock <= m.reorderLevel);
        } else if (stockStatus === 'out') {
            medicines = medicines.filter(m => m.currentStock === 0);
        }

        return NextResponse.json(medicines);
    } catch (error) {
        console.error('Error fetching medicines:', error);
        return NextResponse.json({ error: 'Failed to fetch medicines' }, { status: 500 });
    }
}

// POST: Create new medicine
export async function POST(request: NextRequest) {
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
            currentStock,
            reorderLevel,
            purchasePrice,
            sellingPrice,
            mrp,
            batchNumber,
            expiryDate,
            barcode,
            categoryIds, // Array of category IDs
        } = body;

        // ✅ FIX: Handle empty barcode - set to null instead of empty string
        const barcodeValue = barcode && barcode.trim() !== '' ? barcode.trim() : null;

        // Create medicine
        const medicine = await prisma.medicine.create({
            data: {
                name,
                genericName: genericName || null,
                manufacturer: manufacturer || null,
                type,
                strength: strength || null,
                unit,
                description: description || null,
                currentStock: parseInt(currentStock) || 0,
                reorderLevel: parseInt(reorderLevel) || 10,
                purchasePrice: parseFloat(purchasePrice) || 0,
                sellingPrice: parseFloat(sellingPrice) || 0,
                mrp: parseFloat(mrp) || 0,
                batchNumber: batchNumber || null,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                barcode: barcodeValue, // ✅ Now properly handles empty barcodes
            },
        });

        // Add categories
        if (categoryIds && categoryIds.length > 0) {
            await prisma.medicineCategory.createMany({
                data: categoryIds.map((categoryId: string) => ({
                    medicineId: medicine.id,
                    categoryId,
                })),
            });
        }

        // Create initial stock transaction
        if (currentStock > 0) {
            await prisma.stockTransaction.create({
                data: {
                    medicineId: medicine.id,
                    type: 'IN',
                    quantity: parseInt(currentStock),
                    balanceAfter: parseInt(currentStock),
                    reason: 'Initial Stock',
                },
            });
        }

        return NextResponse.json(medicine, { status: 201 });
    } catch (error: any) {
        console.error('Error creating medicine:', error);

        // ✅ Better error handling for duplicate entries
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'field';
            return NextResponse.json(
                { error: `A medicine with this ${field} already exists` },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create medicine', details: error.message },
            { status: 500 }
        );
    }
}
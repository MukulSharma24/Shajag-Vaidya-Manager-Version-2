import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, getTokenFromCookieString } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const type = searchParams.get('type') || '';
        const categoryId = searchParams.get('categoryId') || '';
        const stockStatus = searchParams.get('stockStatus') || 'all';

        const where: any = { clinicId: payload.clinicId };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { genericName: { contains: search, mode: 'insensitive' } },
                { manufacturer: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (type) where.type = type;
        if (categoryId) where.categories = { some: { categoryId } };

        let medicines = await prisma.medicine.findMany({
            where,
            include: { categories: { include: { category: true } } },
            orderBy: { name: 'asc' },
        });

        if (stockStatus === 'low') medicines = medicines.filter(m => m.currentStock > 0 && m.currentStock <= m.reorderLevel);
        else if (stockStatus === 'out') medicines = medicines.filter(m => m.currentStock === 0);

        return NextResponse.json(medicines);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch medicines' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { name, genericName, manufacturer, type, strength, unit, description,
            currentStock, reorderLevel, purchasePrice, sellingPrice, mrp,
            batchNumber, expiryDate, barcode, categoryIds } = body;

        const medicine = await prisma.medicine.create({
            data: {
                clinicId: payload.clinicId,
                name, genericName: genericName || null, manufacturer: manufacturer || null,
                type, strength: strength || null, unit, description: description || null,
                currentStock: parseInt(currentStock) || 0, reorderLevel: parseInt(reorderLevel) || 10,
                purchasePrice: parseFloat(purchasePrice) || 0, sellingPrice: parseFloat(sellingPrice) || 0,
                mrp: parseFloat(mrp) || 0, batchNumber: batchNumber || null,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                barcode: barcode && barcode.trim() !== '' ? barcode.trim() : null,
            },
        });

        if (categoryIds && categoryIds.length > 0) {
            await prisma.medicineCategory.createMany({
                data: categoryIds.map((categoryId: string) => ({ medicineId: medicine.id, categoryId })),
            });
        }

        if (currentStock > 0) {
            await prisma.stockTransaction.create({
                data: {
                    clinicId: payload.clinicId,
                    medicineId: medicine.id, type: 'IN',
                    quantity: parseInt(currentStock), balanceAfter: parseInt(currentStock),
                    reason: 'Initial Stock',
                },
            });
        }

        return NextResponse.json(medicine, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: `A medicine with this ${error.meta?.target?.[0]} already exists` }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create medicine', details: error.message }, { status: 500 });
    }
}

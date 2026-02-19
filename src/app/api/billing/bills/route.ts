import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, getTokenFromCookieString } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const token = getTokenFromCookieString(req.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const patientId = searchParams.get('patientId');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where: any = { clinicId: payload.clinicId };
        if (status && status !== 'ALL') where.status = status;
        if (patientId) where.patientId = patientId;
        if (fromDate || toDate) {
            where.createdAt = {};
            if (fromDate) where.createdAt.gte = new Date(fromDate);
            if (toDate) where.createdAt.lte = new Date(toDate);
        }

        const [bills, total] = await Promise.all([
            prisma.bill.findMany({
                where,
                include: { patient: true, billItems: true, payments: true, billedByUser: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.bill.count({ where }),
        ]);

        const stats = await prisma.bill.aggregate({
            where: { clinicId: payload.clinicId },
            _sum: { totalAmount: true, paidAmount: true, balanceAmount: true },
            _count: true,
        });

        return NextResponse.json({
            bills,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
            stats: { totalBills: stats._count, totalRevenue: stats._sum.totalAmount || 0, totalPaid: stats._sum.paidAmount || 0, totalPending: stats._sum.balanceAmount || 0 },
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = getTokenFromCookieString(req.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { patientId, prescriptionId, appointmentId, billedBy, items, billItems,
            discountPercentage = 0, discountAmount = 0, notes, status = 'DRAFT' } = body;

        const itemsArray = billItems || items;
        if (!itemsArray || !Array.isArray(itemsArray) || itemsArray.length === 0)
            return NextResponse.json({ error: 'Bill items are required' }, { status: 400 });
        if (!patientId)
            return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });

        const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId: payload.clinicId } });
        if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

        const clinicId = payload.clinicId;
        const lastBill = await prisma.bill.findFirst({ where: { clinicId }, orderBy: { createdAt: 'desc' }, select: { billNumber: true } });
        const billNumber = generateBillNumber(lastBill?.billNumber);

        let subtotal = 0;
        const processedItems = itemsArray.map((item: any) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const taxAmount = (itemSubtotal * (item.taxPercentage || 0)) / 100;
            subtotal += itemSubtotal;
            return { itemName: item.itemName, description: item.description || '', itemType: item.itemType,
                quantity: item.quantity, unitPrice: item.unitPrice, taxPercentage: item.taxPercentage || 0,
                taxAmount, discountAmount: item.discountAmount || 0,
                totalAmount: itemSubtotal + taxAmount - (item.discountAmount || 0) };
        });

        const finalDiscountAmount = discountAmount || (subtotal * discountPercentage) / 100;
        const taxAmount = processedItems.reduce((sum: number, item: any) => sum + item.taxAmount, 0);
        const totalAmount = subtotal + taxAmount - finalDiscountAmount;

        const billData: any = { billNumber, patientId, clinicId, subtotal, discountAmount: finalDiscountAmount,
            discountPercentage, taxAmount, totalAmount, balanceAmount: totalAmount, paidAmount: 0,
            status, notes: notes || '', billItems: { create: processedItems } };

        if (prescriptionId) billData.prescriptionId = prescriptionId;
        if (appointmentId) billData.appointmentId = appointmentId;
        if (billedBy) billData.billedBy = billedBy;

        const bill = await prisma.bill.create({ data: billData });
        const completeBill = await prisma.bill.findUnique({ where: { id: bill.id }, include: { billItems: true, patient: true } });

        return NextResponse.json({ bill: completeBill }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create bill', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}

function generateBillNumber(lastBillNumber?: string): string {
    const prefix = 'INV';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    if (!lastBillNumber) return `${prefix}${year}${month}-0001`;
    const parts = lastBillNumber.split('-');
    const newNumber = (parseInt(parts[1] || '0') + 1).toString().padStart(4, '0');
    return `${prefix}${year}${month}-${newNumber}`;
}

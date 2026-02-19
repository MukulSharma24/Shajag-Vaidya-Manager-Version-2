// src/app/api/billing/bills/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, getTokenFromCookieString } from '@/lib/auth';

// GET - Fetch all bills with filters
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

        // ✅ Always scoped to clinic
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
                include: {
                    patient: true,
                    billItems: true,
                    payments: true,
                    billedByUser: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.bill.count({ where }),
        ]);

        // ✅ Stats also scoped to clinic
        const stats = await prisma.bill.aggregate({
            where: { clinicId: payload.clinicId },
            _sum: { totalAmount: true, paidAmount: true, balanceAmount: true },
            _count: true,
        });

        return NextResponse.json({
            bills,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
            stats: {
                totalBills: stats._count,
                totalRevenue: stats._sum.totalAmount || 0,
                totalPaid: stats._sum.paidAmount || 0,
                totalPending: stats._sum.balanceAmount || 0,
            },
        });
    } catch (error) {
        console.error('Error fetching bills:', error);
        return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
    }
}

// POST - Create new bill
export async function POST(req: NextRequest) {
    try {
        const token = getTokenFromCookieString(req.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        console.log('📥 Received bill creation request');

        const {
            patientId,
            prescriptionId,
            appointmentId,
            billedBy,
            items,
            billItems,
            discountPercentage = 0,
            discountAmount = 0,
            notes,
            status = 'DRAFT',
        } = body;

        const itemsArray = billItems || items;

        if (!itemsArray || !Array.isArray(itemsArray) || itemsArray.length === 0) {
            return NextResponse.json({ error: 'Bill items are required' }, { status: 400 });
        }

        if (!patientId) {
            return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
        }

        // ✅ Verify patient belongs to this clinic
        const patient = await prisma.patient.findFirst({
            where: { id: patientId, clinicId: payload.clinicId },
        });

        if (!patient) {
            return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        }

        console.log('✅ Patient found:', patient.fullName);

        // ✅ clinicId always from JWT — never from request body
        const clinicId = payload.clinicId;

        const lastBill = await prisma.bill.findFirst({
            where: { clinicId },
            orderBy: { createdAt: 'desc' },
            select: { billNumber: true },
        });

        const billNumber = generateBillNumber(lastBill?.billNumber);
        console.log('📋 Generated bill number:', billNumber);

        let subtotal = 0;
        const processedItems = itemsArray.map((item: any) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const taxAmount = (itemSubtotal * (item.taxPercentage || 0)) / 100;
            const itemTotal = itemSubtotal + taxAmount - (item.discountAmount || 0);
            subtotal += itemSubtotal;

            return {
                itemName: item.itemName,
                description: item.description || '',
                itemType: item.itemType,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxPercentage: item.taxPercentage || 0,
                taxAmount,
                discountAmount: item.discountAmount || 0,
                totalAmount: itemTotal,
            };
        });

        const finalDiscountAmount = discountAmount || (subtotal * discountPercentage) / 100;
        const taxAmount = processedItems.reduce((sum: number, item: any) => sum + item.taxAmount, 0);
        const totalAmount = subtotal + taxAmount - finalDiscountAmount;

        const billData: any = {
            billNumber,
            patientId,
            clinicId, // ✅ Always from JWT
            subtotal,
            discountAmount: finalDiscountAmount,
            discountPercentage,
            taxAmount,
            totalAmount,
            balanceAmount: totalAmount,
            paidAmount: 0,
            status,
            notes: notes || '',
            billItems: { create: processedItems },
        };

        if (prescriptionId) billData.prescriptionId = prescriptionId;
        if (appointmentId) billData.appointmentId = appointmentId;
        if (billedBy) billData.billedBy = billedBy;

        const bill = await prisma.bill.create({ data: billData });

        const completeBill = await prisma.bill.findUnique({
            where: { id: bill.id },
            include: { billItems: true, patient: true },
        });

        try {
            await createLedgerEntry({
                patientId,
                clinicId,
                transactionType: 'BILL',
                referenceId: bill.id,
                referenceType: 'BILL',
                debitAmount: totalAmount,
                description: `Bill ${billNumber} created`,
            });
        } catch (ledgerError) {
            console.error('⚠️ Ledger failed (non-critical):', ledgerError);
        }

        return NextResponse.json({ bill: completeBill }, { status: 201 });
    } catch (error) {
        console.error('❌ Error creating bill:', error);
        return NextResponse.json(
            {
                error: 'Failed to create bill',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

function generateBillNumber(lastBillNumber?: string): string {
    const prefix = 'INV';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    if (!lastBillNumber) return `${prefix}${year}${month}-0001`;

    const parts = lastBillNumber.split('-');
    const lastNumber = parseInt(parts[1] || '0');
    const newNumber = (lastNumber + 1).toString().padStart(4, '0');

    return `${prefix}${year}${month}-${newNumber}`;
}

async function createLedgerEntry(data: {
    patientId: string;
    clinicId: string;
    transactionType: string;
    referenceId: string;
    referenceType: string;
    debitAmount?: number;
    creditAmount?: number;
    description: string;
}) {
    try {
        const lastEntry = await prisma.patientLedger.findFirst({
            where: { patientId: data.patientId },
            orderBy: { transactionDate: 'desc' },
            select: { balance: true },
        });

        const currentBalance = Number(lastEntry?.balance || 0);
        const debit = data.debitAmount || 0;
        const credit = data.creditAmount || 0;
        const newBalance = currentBalance + debit - credit;

        await prisma.patientLedger.create({
            data: {
                patientId: data.patientId,
                clinicId: data.clinicId,
                transactionType: data.transactionType,
                referenceId: data.referenceId,
                referenceType: data.referenceType,
                debitAmount: debit,
                creditAmount: credit,
                balance: newBalance,
                description: data.description,
            },
        });
    } catch (error) {
        console.error('Error creating ledger:', error);
    }
}
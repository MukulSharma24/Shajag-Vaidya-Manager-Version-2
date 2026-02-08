import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all bills with filters
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const patientId = searchParams.get('patientId');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where: any = {};

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

        const stats = await prisma.bill.aggregate({
            where: {},
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

// Helper: Get or create default clinic
async function getOrCreateDefaultClinic(): Promise<string> {
    try {
        // Try to find any existing clinic
        let clinic = await prisma.clinic.findFirst();

        if (!clinic) {
            console.log('📝 No clinic found, creating default clinic...');
            // Create a default clinic
            clinic = await prisma.clinic.create({
                data: {
                    name: 'Default Clinic',
                    address: 'Not specified',
                    phone: 'Not specified',
                    email: 'clinic@example.com',
                },
            });
            console.log('✅ Default clinic created:', clinic.id);
        } else {
            console.log('✅ Using existing clinic:', clinic.id, clinic.name);
        }

        return clinic.id;
    } catch (error) {
        console.error('❌ Error getting/creating clinic:', error);
        throw new Error('Failed to get or create clinic');
    }
}

// POST - Create new bill
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('📥 Received bill creation request');

        const {
            patientId,
            prescriptionId,
            appointmentId,
            clinicId: providedClinicId,
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
            console.error('❌ Validation error: billItems missing');
            return NextResponse.json(
                { error: 'Bill items are required' },
                { status: 400 }
            );
        }

        if (!patientId) {
            console.error('❌ Validation error: patientId missing');
            return NextResponse.json(
                { error: 'Patient ID is required' },
                { status: 400 }
            );
        }

        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
        });

        if (!patient) {
            console.error('❌ Patient not found:', patientId);
            return NextResponse.json(
                { error: 'Patient not found' },
                { status: 404 }
            );
        }

        console.log('✅ Patient found:', patient.fullName);

        // Get or create clinic
        const clinicId = providedClinicId || await getOrCreateDefaultClinic();
        console.log('🏥 Using clinic ID:', clinicId);

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

        console.log('💰 Calculations:', { subtotal, taxAmount, discount: finalDiscountAmount, total: totalAmount });

        const billData: any = {
            billNumber,
            patientId,
            clinicId, // ✅ Always provided now
            subtotal,
            discountAmount: finalDiscountAmount,
            discountPercentage,
            taxAmount,
            totalAmount,
            balanceAmount: totalAmount,
            paidAmount: 0,
            status,
            notes: notes || '',
            billItems: {
                create: processedItems,
            },
        };

        if (prescriptionId) billData.prescriptionId = prescriptionId;
        if (appointmentId) billData.appointmentId = appointmentId;
        if (billedBy) billData.billedBy = billedBy;

        console.log('💾 Creating bill...');

        const bill = await prisma.bill.create({
            data: billData,
        });

        console.log('✅ Bill created! ID:', bill.id);

        // Fetch complete bill with relations
        const completeBill = await prisma.bill.findUnique({
            where: { id: bill.id },
            include: {
                billItems: true,
                patient: true,
            },
        });

        // Create ledger entry
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
            console.log('✅ Ledger entry created');
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

    if (!lastBillNumber) {
        return `${prefix}${year}${month}-0001`;
    }

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
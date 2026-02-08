import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Record payment against a bill
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            billId,
            amount,
            paymentMethod,
            transactionId,
            referenceNumber,
            notes,
            clinicId, // You'll need to pass this from the frontend now
            receivedBy, // You'll need to pass userId from the frontend
        } = body;

        // Validate payment amount
        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
        }

        // Fetch bill
        const bill = await prisma.bill.findUnique({
            where: {
                id: billId,
            },
        });

        if (!bill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
        }

        // Check if payment exceeds balance
        if (amount > Number(bill.balanceAmount)) {
            return NextResponse.json(
                { error: 'Payment amount exceeds outstanding balance' },
                { status: 400 }
            );
        }

        // Generate payment number
        const lastPayment = await prisma.payment.findFirst({
            where: clinicId ? { clinicId } : {},
            orderBy: { createdAt: 'desc' },
            select: { paymentNumber: true },
        });

        const paymentNumber = generatePaymentNumber(lastPayment?.paymentNumber);

        // Build payment data
        const paymentData: any = {
            paymentNumber,
            billId: billId,
            patientId: bill.patientId,
            clinicId: bill.clinicId, // Get clinicId from the bill (it's required)
            amount: Number(amount),
            paymentMethod,
            transactionId: transactionId || undefined,
            referenceNumber: referenceNumber || undefined,
            notes: notes || undefined,
            paymentStatus: 'COMPLETED',
        };

        // Add optional receivedBy if provided
        if (receivedBy) paymentData.receivedBy = receivedBy;

        console.log('Creating payment with data:', JSON.stringify(paymentData, null, 2));

        // Create payment
        const payment = await prisma.payment.create({
            data: paymentData,
        });

        // Update bill
        const newPaidAmount = Number(bill.paidAmount) + amount;
        const newBalanceAmount = Number(bill.totalAmount) - newPaidAmount;

        let newStatus = bill.status;
        if (newBalanceAmount === 0) {
            newStatus = 'PAID';
        } else if (newPaidAmount > 0 && newBalanceAmount > 0) {
            newStatus = 'PARTIAL';
        }

        const updatedBill = await prisma.bill.update({
            where: { id: billId },
            data: {
                paidAmount: newPaidAmount,
                balanceAmount: newBalanceAmount,
                status: newStatus,
            },
            include: {
                patient: true,
                billItems: true,
                payments: true,
            },
        });

        // Create ledger entry
        await createLedgerEntry({
            patientId: bill.patientId,
            clinicId: bill.clinicId, // Use bill's clinicId
            transactionType: 'PAYMENT',
            referenceId: payment.id,
            referenceType: 'PAYMENT',
            creditAmount: Number(amount),
            description: `Payment ${paymentNumber} received for Bill ${bill.billNumber}`,
        });

        return NextResponse.json({
            payment,
            bill: updatedBill,
            message: 'Payment recorded successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error recording payment:', error);
        return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }
}

// GET - Fetch payments with filters
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const billId = searchParams.get('billId');
        const patientId = searchParams.get('patientId');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');

        const where: any = {};

        if (billId) where.billId = billId;
        if (patientId) where.patientId = patientId;

        if (fromDate || toDate) {
            where.paymentDate = {};
            if (fromDate) where.paymentDate.gte = new Date(fromDate);
            if (toDate) where.paymentDate.lte = new Date(toDate);
        }

        const payments = await prisma.payment.findMany({
            where,
            include: {
                bill: {
                    select: {
                        billNumber: true,
                        totalAmount: true,
                    },
                },
                patient: true,
                receivedByUser: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                paymentDate: 'desc',
            },
        });

        return NextResponse.json({ payments });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }
}

// Helper functions
function generatePaymentNumber(lastPaymentNumber?: string): string {
    const prefix = 'PAY';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    if (!lastPaymentNumber) {
        return `${prefix}${year}${month}-0001`;
    }

    const parts = lastPaymentNumber.split('-');
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
}
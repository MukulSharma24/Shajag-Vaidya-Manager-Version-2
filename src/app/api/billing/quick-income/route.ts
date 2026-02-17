import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper: resolve clinic ID without requiring frontend to send it
async function resolveClinicId(providedClinicId?: string): Promise<string | null> {
    if (providedClinicId) return providedClinicId;
    try {
        const clinic = await prisma.clinic.findFirst({ select: { id: true } });
        return clinic?.id ?? null;
    } catch {
        return null;
    }
}

// GET - Fetch all quick income entries
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: any = {};
        if (fromDate || toDate) {
            where.receivedDate = {};
            if (fromDate) where.receivedDate.gte = new Date(fromDate);
            if (toDate) where.receivedDate.lte = new Date(toDate);
        }

        const [entries, total] = await Promise.all([
            prisma.quickIncome.findMany({
                where,
                orderBy: { receivedDate: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.quickIncome.count({ where }),
        ]);

        const stats = await prisma.quickIncome.aggregate({
            where: {},
            _sum: { amount: true },
            _count: true,
        });

        return NextResponse.json({
            entries,
            pagination: { total, page, limit },
            stats: {
                totalEntries: stats._count,
                totalAmount: Number(stats._sum.amount || 0),
            },
        });
    } catch (error: any) {
        console.error('Error fetching quick income:', error);
        return NextResponse.json({ error: 'Failed to fetch income entries', details: error?.message }, { status: 500 });
    }
}

// POST - Record a new quick income entry
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            amount,
            description,
            paymentMethod = 'UPI',
            receivedDate,
            patientName,
            patientId,
            referenceNumber,
            category = 'DIRECT_PAYMENT',
            clinicId: providedClinicId,
            recordedBy,
        } = body;

        if (!amount || parseFloat(amount) <= 0) {
            return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
        }

        if (!receivedDate) {
            return NextResponse.json({ error: 'Received date is required' }, { status: 400 });
        }

        const clinicId = await resolveClinicId(providedClinicId);

        // Generate entry number
        const lastEntry = await prisma.quickIncome.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { entryNumber: true },
        });

        const entryNumber = generateEntryNumber(lastEntry?.entryNumber);

        const entryData: any = {
            entryNumber,
            amount: parseFloat(amount),
            description: description?.trim() || '',
            paymentMethod,
            receivedDate: new Date(receivedDate),
            category,
        };

        if (patientName?.trim()) entryData.patientName = patientName.trim();
        if (patientId?.trim()) entryData.patientId = patientId.trim();
        if (referenceNumber?.trim()) entryData.referenceNumber = referenceNumber.trim();
        if (clinicId) entryData.clinicId = clinicId;
        if (recordedBy) entryData.recordedBy = recordedBy;

        const entry = await prisma.quickIncome.create({ data: entryData });

        console.log('Quick income recorded:', entry.entryNumber, entry.amount);

        return NextResponse.json({ entry }, { status: 201 });
    } catch (error: any) {
        console.error('Error recording quick income:', error);
        return NextResponse.json(
            { error: 'Failed to record income', details: error?.message },
            { status: 500 }
        );
    }
}

function generateEntryNumber(lastNumber?: string): string {
    const prefix = 'INC';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    if (!lastNumber) return `${prefix}${year}${month}-0001`;
    const parts = lastNumber.split('-');
    const num = parseInt(parts[1] || '0') + 1;
    return `${prefix}${year}${month}-${num.toString().padStart(4, '0')}`;
}
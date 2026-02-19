import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken, getTokenFromCookieString } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const patient = await prisma.patient.findFirst({
            where: { id: params.id, clinicId: payload.clinicId },
            include: {
                appointments: { orderBy: { appointmentDate: 'desc' }, take: 5 },
                Prescription: { orderBy: { createdAt: 'desc' }, take: 5 },
            },
        });

        if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
        return NextResponse.json(patient);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        const existing = await prisma.patient.findFirst({ where: { id: params.id, clinicId: payload.clinicId } });
        if (!existing) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

        if (body.phoneNumber) {
            const duplicate = await prisma.patient.findFirst({
                where: { phoneNumber: body.phoneNumber, clinicId: payload.clinicId, NOT: { id: params.id } },
            });
            if (duplicate) return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
        }

        const updateData: any = {};
        const fields = ['fullName','age','gender','phoneNumber','email','city','state','bloodGroup','notes',
            'addressLine1','addressLine2','postalCode','constitutionType'];
        fields.forEach(f => { if (body[f] !== undefined) updateData[f] = body[f]; });

        const patient = await prisma.patient.update({ where: { id: params.id }, data: updateData });
        return NextResponse.json(patient);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = getTokenFromCookieString(request.headers.get('cookie'));
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const payload = await getUserFromToken(token);
        if (!payload?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const existing = await prisma.patient.findFirst({ where: { id: params.id, clinicId: payload.clinicId } });
        if (!existing) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

        await prisma.patient.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 });
    }
}

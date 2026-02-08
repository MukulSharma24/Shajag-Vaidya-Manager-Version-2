import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        const appointment = await prisma.appointment.update({
            where: { id: params.id },
            data: {
                status: body.status,
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        fullName: true,
                        phoneNumber: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(appointment);
    } catch (error) {
        console.error('Error updating appointment status:', error);
        return NextResponse.json(
            { error: 'Failed to update appointment status' },
            { status: 500 }
        );
    }
}
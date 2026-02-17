export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const patients = await prisma.patient.findMany({
            select: { constitutionType: true }
        });

        const constitutionCounts: Record<string, number> = {
            'Vata': 0,
            'Pitta': 0,
            'Kapha': 0,
            'Vata-Pitta': 0,
            'Pitta-Kapha': 0,
            'Vata-Kapha': 0,
            'Tridosha': 0,
            'Not assessed yet': 0
        };

        patients.forEach(patient => {
            const type = patient.constitutionType;
            if (constitutionCounts.hasOwnProperty(type)) {
                constitutionCounts[type]++;
            } else {
                constitutionCounts[type] = 1;
            }
        });

        delete constitutionCounts['Not assessed yet'];

        const filteredData = Object.entries(constitutionCounts)
            .filter(([_, count]) => count > 0)
            .reduce((acc, [type, count]) => {
                acc[type] = count;
                return acc;
            }, {} as Record<string, number>);

        if (Object.keys(filteredData).length === 0) {
            return NextResponse.json({ labels: ['No Data'], data: [1] });
        }

        return NextResponse.json({
            labels: Object.keys(filteredData),
            data: Object.values(filteredData)
        });

    } catch (error) {
        console.error('Error fetching constitution distribution:', error);
        return NextResponse.json({ labels: ['No Data'], data: [1] });
    }
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Count patients by constitution type
        const patients = await prisma.patient.findMany({
            select: {
                constitutionType: true
            }
        });

        // Initialize counters for all constitution types
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

        // Count each constitution type
        patients.forEach(patient => {
            const type = patient.constitutionType;
            if (constitutionCounts.hasOwnProperty(type)) {
                constitutionCounts[type]++;
            } else {
                constitutionCounts[type] = 1;
            }
        });

        // Remove "Not assessed yet" from the chart data
        delete constitutionCounts['Not assessed yet'];

        // Filter out types with 0 count for cleaner chart
        const filteredData = Object.entries(constitutionCounts)
            .filter(([_, count]) => count > 0)
            .reduce((acc, [type, count]) => {
                acc[type] = count;
                return acc;
            }, {} as Record<string, number>);

        // If no data, return default structure
        if (Object.keys(filteredData).length === 0) {
            return NextResponse.json({
                labels: ['No Data'],
                data: [1]
            });
        }

        return NextResponse.json({
            labels: Object.keys(filteredData),
            data: Object.values(filteredData)
        });

    } catch (error) {
        console.error('Error fetching constitution distribution:', error);

        // Return empty data if database fails
        return NextResponse.json({
            labels: ['No Data'],
            data: [1]
        });
    }
}
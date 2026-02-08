import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch single bill by ID
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const bill = await prisma.bill.findUnique({
            where: {
                id: params.id,
            },
            include: {
                patient: true,
                billItems: true,
                payments: {
                    include: {
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
                },
                billedByUser: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                finalizedByUser: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                prescription: {
                    include: {
                        medicines: true,
                    },
                },
                appointment: true,
            },
        });

        if (!bill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
        }

        return NextResponse.json({ bill });
    } catch (error) {
        console.error('Error fetching bill:', error);
        return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
    }
}

// PATCH - Update bill (edit items, add discount, finalize)
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const {
            items,
            discountPercentage,
            discountAmount,
            notes,
            status,
            finalize = false,
        } = body;

        // Fetch existing bill
        const existingBill = await prisma.bill.findUnique({
            where: {
                id: params.id,
            },
            include: {
                billItems: true,
            },
        });

        if (!existingBill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
        }

        // Can't edit paid or cancelled bills
        if (existingBill.status === 'PAID' || existingBill.status === 'CANCELLED') {
            return NextResponse.json(
                { error: 'Cannot edit paid or cancelled bills' },
                { status: 400 }
            );
        }

        let updateData: any = {};

        // If items are being updated, recalculate totals
        if (items && items.length > 0) {
            // Delete old items
            await prisma.billItem.deleteMany({
                where: { billId: params.id },
            });

            // Calculate new totals
            let subtotal = 0;
            const processedItems = items.map((item: any) => {
                const itemSubtotal = item.quantity * item.unitPrice;
                const taxAmount = (itemSubtotal * (item.taxPercentage || 0)) / 100;
                const itemTotal = itemSubtotal + taxAmount - (item.discountAmount || 0);

                subtotal += itemSubtotal;

                return {
                    itemName: item.itemName,
                    description: item.description,
                    itemType: item.itemType,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxPercentage: item.taxPercentage || 0,
                    taxAmount: taxAmount,
                    discountAmount: item.discountAmount || 0,
                    totalAmount: itemTotal,
                    referenceId: item.referenceId,
                    referenceType: item.referenceType,
                };
            });

            const finalDiscountAmount = discountAmount || (subtotal * (discountPercentage || 0)) / 100;
            const taxAmount = processedItems.reduce((sum: number, item: any) => sum + item.taxAmount, 0);
            const totalAmount = subtotal + taxAmount - finalDiscountAmount;

            updateData = {
                subtotal,
                discountAmount: finalDiscountAmount,
                discountPercentage: discountPercentage || 0,
                taxAmount,
                totalAmount,
                balanceAmount: totalAmount - Number(existingBill.paidAmount),
                billItems: {
                    create: processedItems,
                },
            };
        }

        // Update other fields
        if (notes !== undefined) updateData.notes = notes;
        if (status) updateData.status = status;

        // Handle finalization
        if (finalize) {
            updateData.status = 'PENDING';
            // Note: Removed session.user.id, you'll need to pass userId from frontend or set a default
            // updateData.finalizedBy = session.user.id;
            updateData.finalizedAt = new Date();
        }

        const bill = await prisma.bill.update({
            where: { id: params.id },
            data: updateData,
            include: {
                billItems: true,
                patient: true,
                payments: true,
            },
        });

        // Update ledger if total changed
        if (updateData.totalAmount && updateData.totalAmount !== Number(existingBill.totalAmount)) {
            await updateLedgerEntry({
                patientId: existingBill.patientId,
                clinicId: existingBill.clinicId,
                referenceId: bill.id,
                oldAmount: Number(existingBill.totalAmount),
                newAmount: updateData.totalAmount,
            });
        }

        return NextResponse.json({ bill });
    } catch (error) {
        console.error('Error updating bill:', error);
        return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 });
    }
}

// DELETE - Cancel bill
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const bill = await prisma.bill.findUnique({
            where: {
                id: params.id,
            },
        });

        if (!bill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
        }

        // Can't delete paid bills
        if (Number(bill.paidAmount) > 0) {
            return NextResponse.json(
                { error: 'Cannot delete bills with payments. Cancel instead.' },
                { status: 400 }
            );
        }

        // Update status to cancelled
        const cancelled = await prisma.bill.update({
            where: { id: params.id },
            data: { status: 'CANCELLED' },
        });

        // Update ledger
        await createLedgerEntry({
            patientId: bill.patientId,
            clinicId: bill.clinicId,
            transactionType: 'ADJUSTMENT',
            referenceId: bill.id,
            referenceType: 'BILL_CANCELLED',
            creditAmount: Number(bill.totalAmount),
            description: `Bill ${bill.billNumber} cancelled`,
        });

        return NextResponse.json({ message: 'Bill cancelled successfully', bill: cancelled });
    } catch (error) {
        console.error('Error cancelling bill:', error);
        return NextResponse.json({ error: 'Failed to cancel bill' }, { status: 500 });
    }
}

// Helper functions
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

async function updateLedgerEntry(data: {
    patientId: string;
    clinicId: string;
    referenceId: string;
    oldAmount: number;
    newAmount: number;
}) {
    const adjustment = data.newAmount - data.oldAmount;

    await createLedgerEntry({
        patientId: data.patientId,
        clinicId: data.clinicId,
        transactionType: 'ADJUSTMENT',
        referenceId: data.referenceId,
        referenceType: 'BILL_ADJUSTED',
        debitAmount: adjustment > 0 ? adjustment : 0,
        creditAmount: adjustment < 0 ? Math.abs(adjustment) : 0,
        description: `Bill amount adjusted from ₹${data.oldAmount} to ₹${data.newAmount}`,
    });
}
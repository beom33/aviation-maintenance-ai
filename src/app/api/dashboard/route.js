import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user, totalAircraft, assignments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { airline: true },
    }),
    prisma.aircraft.count({ where: { airlineId: session.user.airlineId } }),
    prisma.assignment.findMany({
      where: { userId: session.user.id },
      include: { aircraft: { include: { airline: true } } },
      orderBy: { assignedAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      airline: user.airline,
    },
    totalAircraft,
    assignments: assignments.map((a) => a.aircraft),
  });
}

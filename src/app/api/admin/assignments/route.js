import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const assignments = await prisma.assignment.findMany({
    include: {
      user: { include: { airline: true } },
      aircraft: { include: { airline: true } },
    },
    orderBy: { assignedAt: 'desc' },
  });
  return NextResponse.json(assignments);
}

export async function POST(request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { userId, aircraftId } = await request.json();
  try {
    const assignment = await prisma.assignment.create({ data: { userId, aircraftId } });
    return NextResponse.json(assignment, { status: 201 });
  } catch {
    return NextResponse.json({ error: '이미 배정된 항공기입니다' }, { status: 409 });
  }
}

export async function DELETE(request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await request.json();
  await prisma.assignment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

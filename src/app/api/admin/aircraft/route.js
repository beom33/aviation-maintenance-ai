import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const aircraft = await prisma.aircraft.findMany({
    include: { airline: true, assignments: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(aircraft);
}

export async function POST(request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { registration, type, manufacturer, airlineId } = await request.json();
  try {
    const aircraft = await prisma.aircraft.create({
      data: { registration, type, manufacturer, airlineId },
    });
    return NextResponse.json(aircraft, { status: 201 });
  } catch {
    return NextResponse.json({ error: '이미 등록된 등록번호입니다' }, { status: 409 });
  }
}

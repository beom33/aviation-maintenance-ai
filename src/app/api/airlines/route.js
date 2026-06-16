import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const airlines = await prisma.airline.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(airlines);
}

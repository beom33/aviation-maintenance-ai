import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request, { params }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { role } = await request.json();
  const user = await prisma.user.update({ where: { id: params.id }, data: { role } });
  return NextResponse.json({ success: true, role: user.role });
}

export async function DELETE(_request, { params }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: '자기 자신은 삭제할 수 없습니다' }, { status: 400 });
  }
  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[admin] delete user error:', e);
    return NextResponse.json({ error: '삭제 중 오류가 발생했습니다' }, { status: 500 });
  }
}

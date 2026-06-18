import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { name, email, password, employeeId, airlineId, adminCode } = await request.json();

    if (!name || !email || !password || !employeeId || !airlineId) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다' }, { status: 400 });
    }

    // 관리자 코드 검증
    let role = 'TECHNICIAN';
    if (adminCode) {
      const validCode = process.env.ADMIN_REGISTRATION_CODE;
      if (!validCode || adminCode !== validCode) {
        return NextResponse.json({ error: '관리자 코드가 올바르지 않습니다' }, { status: 403 });
      }
      role = 'ADMIN';
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, employeeId, airlineId, role },
    });

    return NextResponse.json({ success: true, userId: user.id, role }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

import { PrismaClient } from '@prisma/client';
import { createRequire } from 'module';
import * as path from 'path';
import * as fs from 'fs';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const prisma = new PrismaClient();

// 기종 이름으로 제조사 추론
function inferManufacturer(type: string): string {
  const t = type.toUpperCase();
  if (t.startsWith('B') && /^B\d/.test(t)) return 'Boeing';
  if (t.startsWith('A') && /^A\d/.test(t)) return 'Airbus';
  if (t.includes('EMBRAER') || t.startsWith('E1') || t.startsWith('E17') || t.startsWith('E19')) return 'Embraer';
  if (t.includes('BOMBARDIER') || t.startsWith('Q4') || t.startsWith('CRJ') || t.startsWith('DHC')) return 'Bombardier';
  if (t.includes('ATR')) return 'ATR';
  return '미상';
}

// 소유자 이름에 이 문자열이 포함되면 해당 항공사 코드로 매핑
const OWNER_TO_CODE: [string, string][] = [
  ['대한항공', 'KE'],
  ['아시아나', 'OZ'],
  ['제주항공', '7C'],
  ['진에어', 'LJ'],
  ['티웨이', 'TW'],
  ['에어부산', 'BX'],
  ['에어서울', 'RS'],
  ['에어프레미아', 'YP'],
  ['이스타', 'ZE'],
];

function resolveAirlineCode(ownerName: string): string | null {
  if (!ownerName) return null;
  const match = OWNER_TO_CODE.find(([keyword]) => ownerName.includes(keyword));
  return match ? match[1] : null;
}

async function main() {
  const filePath = path.join(process.cwd(), 'prisma', 'aircraft.xlsx');

  if (!fs.existsSync(filePath)) {
    console.error('❌ 파일이 없습니다: prisma/aircraft.xlsx');
    console.error('   http://atis.koca.go.kr/ATIS/aircraft/forwardPage.do?pageUrl=aircraftRegStat01');
    console.error('   위 주소에서 Excel 파일을 다운받아 prisma/aircraft.xlsx 로 저장하세요.');
    process.exit(1);
  }

  console.log('📂 Excel 파일 읽는 중...');
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // range: 1 → 1번 인덱스 행을 헤더로 사용 (0번은 "ATIS 항공기술정보시스템" 제목 행)
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { range: 1, defval: '' });

  console.log(`총 ${rows.length}행 발견`);

  // DB에서 항공사 목록 조회
  const airlines = await prisma.airline.findMany();
  const airlineByCode = new Map(airlines.map((a: { code: string; id: string }) => [a.code, a]));

  let saved = 0;
  let skipped = 0;

  for (const row of rows) {
    const registration = String(row['등록기호'] || '').trim();
    const type = String(row['형식'] || '').trim();
    const ownerName = String(row['항공사'] || '').trim();
    const manufacturer = inferManufacturer(type);

    if (!registration || !registration.startsWith('HL')) { skipped++; continue; }

    const airlineCode = resolveAirlineCode(ownerName);
    if (!airlineCode) { skipped++; continue; }

    const airline = airlineByCode.get(airlineCode) as { code: string; id: string } | undefined;
    if (!airline) { skipped++; continue; }

    await prisma.aircraft.upsert({
      where: { registration },
      update: { type: type || '미상', manufacturer: manufacturer || '미상', airlineId: airline.id },
      create: {
        registration,
        type: type || '미상',
        manufacturer: manufacturer || '미상',
        airlineId: airline.id,
      },
    });

    saved++;
    process.stdout.write(`\r  처리 중: ${saved}대`);
  }

  console.log(`\n\n🛫 동기화 완료`);
  console.log(`  - 저장/업데이트: ${saved}대`);
  console.log(`  - 스킵 (대상 항공사 외): ${skipped}대`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import bcrypt from 'bcryptjs';

// Dynamically import the generated Prisma client after migration
const { PrismaClient } = await import('../src/generated/prisma/index.js');
const prisma = new PrismaClient();

const airlines = [
  { name: '대한항공', nameEn: 'Korean Air', code: 'KE' },
  { name: '아시아나항공', nameEn: 'Asiana Airlines', code: 'OZ' },
  { name: '제주항공', nameEn: 'Jeju Air', code: '7C' },
  { name: '진에어', nameEn: 'Jin Air', code: 'LJ' },
  { name: '티웨이항공', nameEn: "T'Way Air", code: 'TW' },
  { name: '에어부산', nameEn: 'Air Busan', code: 'BX' },
  { name: '에어서울', nameEn: 'Air Seoul', code: 'RS' },
  { name: '에어프레미아', nameEn: 'Air Premia', code: 'YP' },
  { name: '이스타항공', nameEn: 'Eastar Jet', code: 'ZE' },
];

const aircraftData = {
  KE: [
    { registration: 'HL7456', type: 'B737-900', manufacturer: 'Boeing' },
    { registration: 'HL7457', type: 'B737-800', manufacturer: 'Boeing' },
    { registration: 'HL7526', type: 'B787-9', manufacturer: 'Boeing' },
    { registration: 'HL7612', type: 'B777-200ER', manufacturer: 'Boeing' },
    { registration: 'HL7534', type: 'A380-800', manufacturer: 'Airbus' },
    { registration: 'HL7716', type: 'B747-8i', manufacturer: 'Boeing' },
    { registration: 'HL7730', type: 'A220-300', manufacturer: 'Airbus' },
    { registration: 'HL8011', type: 'A330-300', manufacturer: 'Airbus' },
  ],
  OZ: [
    { registration: 'HL7792', type: 'A380-800', manufacturer: 'Airbus' },
    { registration: 'HL7775', type: 'A350-900', manufacturer: 'Airbus' },
    { registration: 'HL8003', type: 'A321-200', manufacturer: 'Airbus' },
    { registration: 'HL7776', type: 'B767-300', manufacturer: 'Boeing' },
    { registration: 'HL7595', type: 'B777-200ER', manufacturer: 'Boeing' },
    { registration: 'HL8250', type: 'A320neo', manufacturer: 'Airbus' },
  ],
  '7C': [
    { registration: 'HL8097', type: 'B737-800', manufacturer: 'Boeing' },
    { registration: 'HL8098', type: 'B737-800', manufacturer: 'Boeing' },
    { registration: 'HL8228', type: 'B737 MAX 8', manufacturer: 'Boeing' },
    { registration: 'HL8229', type: 'B737-800', manufacturer: 'Boeing' },
  ],
  LJ: [
    { registration: 'HL7554', type: 'B737-800', manufacturer: 'Boeing' },
    { registration: 'HL7555', type: 'B777-200', manufacturer: 'Boeing' },
    { registration: 'HL8313', type: 'B737 MAX 8', manufacturer: 'Boeing' },
  ],
  TW: [
    { registration: 'HL8236', type: 'B737-800', manufacturer: 'Boeing' },
    { registration: 'HL8286', type: 'A330-300', manufacturer: 'Airbus' },
    { registration: 'HL8389', type: 'B737-800', manufacturer: 'Boeing' },
  ],
  BX: [
    { registration: 'HL7419', type: 'B737-500', manufacturer: 'Boeing' },
    { registration: 'HL7796', type: 'A321-200', manufacturer: 'Airbus' },
    { registration: 'HL8333', type: 'A321neo', manufacturer: 'Airbus' },
  ],
  RS: [
    { registration: 'HL7714', type: 'A321-200', manufacturer: 'Airbus' },
    { registration: 'HL7715', type: 'A321-200', manufacturer: 'Airbus' },
  ],
  YP: [
    { registration: 'HL8387', type: 'B787-9', manufacturer: 'Boeing' },
    { registration: 'HL8388', type: 'B787-9', manufacturer: 'Boeing' },
  ],
  ZE: [
    { registration: 'HL8356', type: 'B737-800', manufacturer: 'Boeing' },
    { registration: 'HL8357', type: 'B737-800', manufacturer: 'Boeing' },
  ],
};

async function main() {
  console.log('항공사 데이터 삽입 중...');
  const createdAirlines = {};
  for (const airline of airlines) {
    const created = await prisma.airline.upsert({
      where: { code: airline.code },
      update: {},
      create: airline,
    });
    createdAirlines[airline.code] = created;
  }

  console.log('항공기 데이터 삽입 중...');
  for (const [code, list] of Object.entries(aircraftData)) {
    const airline = createdAirlines[code];
    for (const ac of list) {
      await prisma.aircraft.upsert({
        where: { registration: ac.registration },
        update: {},
        create: { ...ac, airlineId: airline.id },
      });
    }
  }

  console.log('관리자 계정 생성 중...');
  const adminPassword = await bcrypt.hash('admin1234', 12);
  await prisma.user.upsert({
    where: { email: 'admin@aviation.kr' },
    update: {},
    create: {
      name: '관리자',
      email: 'admin@aviation.kr',
      password: adminPassword,
      employeeId: 'ADMIN001',
      airlineId: createdAirlines['KE'].id,
      role: 'ADMIN',
    },
  });

  console.log('완료!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

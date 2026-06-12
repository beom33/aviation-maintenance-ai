import { createRequire } from 'module';
import { addDocument } from '@/lib/documentStore';

const require = createRequire(import.meta.url);
// pdf-parse 1.x는 CJS이므로 createRequire로 로드
const pdfParse = require('pdf-parse');

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: '파일이 없습니다' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return Response.json({ error: 'PDF 파일만 업로드 가능합니다' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_SIZE) {
      return Response.json({ error: '파일 크기는 50MB 이하여야 합니다' }, { status: 400 });
    }

    const buffer = Buffer.from(arrayBuffer);
    const parsed = await pdfParse(buffer);

    if (!parsed.text || parsed.text.trim().length < 100) {
      return Response.json({ error: '텍스트를 추출할 수 없는 PDF입니다 (스캔 이미지 PDF는 지원 안됨)' }, { status: 400 });
    }

    const id = await addDocument(file.name, parsed.text);

    return Response.json({
      id,
      name: file.name,
      pages: parsed.numpages,
      charCount: parsed.text.length,
    });
  } catch (err) {
    console.error('PDF upload error:', err);
    return Response.json({ error: 'PDF 처리 중 오류가 발생했습니다' }, { status: 500 });
  }
}

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'documents.json');

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function loadData() {
  await ensureDataDir();
  try {
    const raw = await readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { documents: [], chunks: [] };
  }
}

async function saveData(data) {
  await ensureDataDir();
  await writeFile(DATA_FILE, JSON.stringify(data), 'utf-8');
}

function chunkText(text, size = 800, overlap = 150) {
  // 텍스트 정리: 연속 공백/줄바꿈 정리
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let start = 0;
  while (start < cleaned.length) {
    chunks.push(cleaned.slice(start, start + size));
    start += size - overlap;
  }
  return chunks;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
  'these', 'those', 'it', 'its', 'not', 'no', 'nor', 'as', 'if', 'each',
  '이', '가', '을', '를', '의', '에', '에서', '은', '는', '로', '으로',
  '도', '와', '과', '이다', '하다', '있다', '없다', '하는', '되는',
]);

export async function getDocuments() {
  const data = await loadData();
  return data.documents;
}

export async function addDocument(name, text) {
  const data = await loadData();
  const id = Date.now().toString();
  const chunks = chunkText(text);

  data.documents.push({
    id,
    name,
    uploadedAt: new Date().toISOString(),
    chunkCount: chunks.length,
    charCount: text.length,
  });

  data.chunks.push(...chunks.map((chunkText, i) => ({ docId: id, index: i, text: chunkText })));

  await saveData(data);
  return id;
}

export async function deleteDocument(id) {
  const data = await loadData();
  data.documents = data.documents.filter(d => d.id !== id);
  data.chunks = data.chunks.filter(c => c.docId !== id);
  await saveData(data);
}

export async function searchDocuments(query, topK = 5) {
  const data = await loadData();
  if (data.chunks.length === 0) return [];

  const words = query
    .toLowerCase()
    .split(/[\s\-_,./()]+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));

  if (words.length === 0) return [];

  const scored = data.chunks.map(chunk => {
    const lower = chunk.text.toLowerCase();
    const score = words.reduce((acc, word) => acc + (lower.includes(word) ? 1 : 0), 0);
    return { text: chunk.text, score };
  });

  return scored
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(c => c.text);
}

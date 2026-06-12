import { getDocuments, deleteDocument } from '@/lib/documentStore';

export async function GET() {
  try {
    const documents = await getDocuments();
    return Response.json(documents);
  } catch {
    return Response.json({ error: 'Failed to load documents' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    await deleteDocument(id);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}

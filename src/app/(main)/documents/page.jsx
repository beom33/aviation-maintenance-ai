'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DocumentsPage() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data);
    } catch {
      // ignore
    }
  };

  const uploadFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadResult({ type: 'error', message: t.documents.onlyPdf });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setUploadResult({ type: 'error', message: data.error });
      } else {
        setUploadResult({
          type: 'success',
          message: `"${data.name}" ${t.documents.uploadSuccess} (${data.pages} ${t.documents.uploadPages})`,
        });
        fetchDocuments();
      }
    } catch {
      setUploadResult({ type: 'error', message: t.documents.errorUpload });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    uploadFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    uploadFile(e.dataTransfer.files?.[0]);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" ${t.documents.deleteConfirm}`)) return;
    try {
      await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchDocuments();
      setUploadResult(null);
    } catch {
      // ignore
    }
  };

  const formatSize = (charCount) => {
    if (charCount > 1_000_000) return `${(charCount / 1_000_000).toFixed(1)}M자`;
    if (charCount > 1_000) return `${(charCount / 1_000).toFixed(0)}K자`;
    return `${charCount}자`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">{t.documents.title}</h2>
        <p className="text-sm text-slate-500">{t.documents.subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* 업로드 영역 */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-3 text-blue-600">
                <Loader className="w-10 h-10 animate-spin" />
                <p className="font-medium">{t.documents.analyzing}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Upload className="w-10 h-10" />
                <div>
                  <p className="font-medium text-slate-600">{t.documents.dropzone}</p>
                  <p className="text-sm mt-1">{t.documents.dropzoneHint}</p>
                </div>
              </div>
            )}
          </div>

          {/* 업로드 결과 */}
          {uploadResult && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${
              uploadResult.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {uploadResult.type === 'success'
                ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <p className="text-sm font-medium">{uploadResult.message}</p>
            </div>
          )}

          {/* 업로드된 문서 목록 */}
          {documents.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
                {t.documents.uploadedDocs} ({documents.length})
              </h3>
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{doc.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {doc.chunkCount}개 청크 · {formatSize(doc.charCount)} · {new Date(doc.uploadedAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id, doc.name)}
                      className="p-1.5 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {documents.length === 0 && !isUploading && (
            <div className="text-center py-8 text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm">{t.documents.noDocuments}</p>
              <p className="text-xs mt-1">{t.documents.noDocumentsHint}</p>
            </div>
          )}

          {/* 안내 */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">{t.documents.howToUse}</p>
            <ol className="space-y-1 text-blue-700 list-decimal list-inside">
              <li>{t.documents.howToStep1}</li>
              <li>{t.documents.howToStep2}</li>
              <li>{t.documents.howToStep3}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

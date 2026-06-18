'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, RefreshCw, Printer, Calendar, PlaneTakeoff, AlertCircle, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ReportPage() {
  const { t } = useLanguage();
  const [allRecords, setAllRecords] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [aircraftFilter, setAircraftFilter] = useState('');
  const [report, setReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const reportRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aviation-work-history');
      if (saved) setAllRecords(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const STATUS_LABEL = {
    completed: t.report.statusCompleted,
    in_progress: t.report.statusInProgress,
    deferred: t.report.statusDeferred,
  };

  const aircraftTypes = [...new Set(allRecords.map(r => r.aircraftType).filter(Boolean))].sort();

  const filteredRecords = allRecords.filter(r => {
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    if (aircraftFilter && r.aircraftType !== aircraftFilter) return false;
    return true;
  });

  const generateReport = async () => {
    if (filteredRecords.length === 0) return;
    setIsGenerating(true);
    setReport('');
    setError('');

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: filteredRecords, dateFrom, dateTo, aircraftFilter }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? t.report.errorGenerate);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setReport(accumulated);
      }
    } catch {
      setError(t.report.errorNetwork);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { padding: 2rem; }
        }
      `}</style>

      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0 no-print">
          <h2 className="text-lg font-semibold text-slate-800">{t.report.title}</h2>
          <p className="text-sm text-slate-500">{t.report.subtitle}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* 필터 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm no-print">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">{t.report.filterTitle}</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t.report.startDate}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t.report.endDate}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-600 mb-1">{t.report.aircraftFilter}</label>
                <div className="relative">
                  <PlaneTakeoff className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={aircraftFilter}
                    onChange={e => setAircraftFilter(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">{t.report.allAircraft}</option>
                    {aircraftTypes.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              {filteredRecords.length > 0 ? (
                <div className="flex gap-3 mb-4 flex-wrap">
                  {['completed', 'in_progress', 'deferred'].map(status => {
                    const count = filteredRecords.filter(r => r.status === status).length;
                    if (count === 0) return null;
                    const colors = {
                      completed: 'bg-green-50 text-green-700 border-green-200',
                      in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
                      deferred: 'bg-orange-50 text-orange-700 border-orange-200',
                    };
                    return (
                      <span key={status} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status]}`}>
                        {STATUS_LABEL[status]} {count}{t.report.countSuffix}
                      </span>
                    );
                  })}
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 text-slate-600 border-slate-200">
                    {t.report.total} {filteredRecords.length}{t.report.countSuffix}
                  </span>
                </div>
              ) : (
                <div className="mb-4 text-sm text-slate-400">{t.report.noRecordsForFilter}</div>
              )}

              <button
                onClick={generateReport}
                disabled={filteredRecords.length === 0 || isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating
                  ? <><RefreshCw className="w-4 h-4 animate-spin" />{t.report.generating}</>
                  : <><FileText className="w-4 h-4" />{t.report.generateButton}</>}
              </button>
            </div>

            {allRecords.length === 0 && (
              <div className="text-center py-16 text-slate-400 no-print">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                <p className="font-medium text-slate-600">{t.report.noHistory}</p>
                <p className="text-sm mt-1 mb-4">{t.report.noHistoryHint}</p>
                <Link href="/history" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  {t.report.goToHistory}
                </Link>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl no-print">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {report && (
              <div ref={reportRef} className="print-area">
                <div className="flex items-center justify-between mb-4 no-print">
                  <span className="text-sm font-semibold text-slate-600">{t.report.generatedReport}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      {t.report.print}
                    </button>
                    <button
                      onClick={() => setReport('')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t.report.deleteReport}
                    </button>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold text-slate-800 mt-6 mb-3">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-700 mt-4 mb-2">{children}</h3>,
                      p: ({ children }) => <p className="text-sm text-slate-700 mb-3 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside text-sm text-slate-700 mb-3 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside text-sm text-slate-700 mb-3 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                      table: ({ children }) => <div className="overflow-x-auto mb-4"><table className="text-xs border-collapse w-full">{children}</table></div>,
                      th: ({ children }) => <th className="border border-slate-300 px-3 py-2 bg-slate-50 font-semibold text-left text-slate-700">{children}</th>,
                      td: ({ children }) => <td className="border border-slate-200 px-3 py-2 text-slate-700">{children}</td>,
                      hr: () => <hr className="border-slate-200 my-4" />,
                    }}
                  >
                    {report}
                  </ReactMarkdown>
                  {isGenerating && (
                    <div className="flex items-center gap-2 mt-4 text-slate-400 text-sm">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {t.report.writing}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, Info, FileText } from 'lucide-react';

interface Analysis {
  code: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  possibleCauses: string[];
  correctiveActions: string[];
  references: string[];
  notes: string;
}

const SEVERITY_STYLE = {
  high: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: '고위험 (즉시 조치)', dot: 'bg-red-500' },
  medium: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', label: '중위험 (차기 정비)', dot: 'bg-orange-500' },
  low: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', label: '저위험 (모니터링)', dot: 'bg-yellow-500' },
};

const EXAMPLE_CODES = ['27-11-00', '34-51-00', 'EICAS FUEL PRESS LOW', 'P0300', 'B1-1-1'];

export default function FaultCodePage() {
  const [code, setCode] = useState('');
  const [aircraftType, setAircraftType] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeCode = async (targetCode?: string) => {
    const c = (targetCode ?? code).trim();
    if (!c) return;
    if (targetCode) setCode(targetCode);
    setIsLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch('/api/fault-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: c, aircraftType }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch {
      alert('분석에 실패했습니다. API 키를 확인하세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const severity = analysis ? SEVERITY_STYLE[analysis.severity] : null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">결함 코드 분석</h2>
        <p className="text-sm text-slate-500">FIM/FRM/EICAS 코드를 입력하면 원인과 조치 방법을 안내합니다</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">결함 코드</label>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && analyzeCode()}
                  placeholder="예: 27-11-00, P0100"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">항공기 종류 (선택)</label>
                <input
                  value={aircraftType}
                  onChange={e => setAircraftType(e.target.value)}
                  placeholder="예: B737-800, A320"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className="text-xs text-slate-400">예시:</span>
              {EXAMPLE_CODES.map(ex => (
                <button
                  key={ex}
                  onClick={() => analyzeCode(ex)}
                  className="text-xs px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded font-mono transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>

            <button
              onClick={() => analyzeCode()}
              disabled={!code.trim() || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><Search className="w-4 h-4 animate-pulse" /> 분석 중...</>
              ) : (
                <><Search className="w-4 h-4" /> 결함 코드 분석</>
              )}
            </button>
          </div>

          {analysis && severity && (
            <div className="space-y-4">
              <div className={`rounded-xl p-5 border ${severity.bg}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${severity.dot}`} />
                      <span className={`text-xs font-semibold ${severity.text}`}>{severity.label}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 font-mono text-xl">{analysis.code}</h3>
                    <p className="text-slate-700 mt-1.5">{analysis.description}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  예상 원인 (Possible Causes)
                </h4>
                <ul className="space-y-2">
                  {analysis.possibleCauses.map((cause, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <span className="shrink-0 w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      {cause}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  수정 조치 (Corrective Actions)
                </h4>
                <ol className="space-y-2">
                  {analysis.correctiveActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <span className="shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      {action}
                    </li>
                  ))}
                </ol>
              </div>

              {analysis.references.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    참조 문서 (References)
                  </h4>
                  <ul className="space-y-1">
                    {analysis.references.map((ref, i) => (
                      <li key={i} className="text-sm text-blue-700 font-mono bg-blue-50 px-3 py-1.5 rounded-lg">{ref}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800"><span className="font-semibold">참고:</span> {analysis.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

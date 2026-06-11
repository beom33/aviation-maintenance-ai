'use client';

import { useState } from 'react';
import { CheckSquare, Square, RefreshCw, ClipboardList } from 'lucide-react';
import type { ChecklistItem } from '@/lib/types';

export default function ChecklistPage() {
  const [aircraftType, setAircraftType] = useState('');
  const [taskType, setTaskType] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');

  const generateChecklist = async () => {
    if (!aircraftType.trim() || !taskType.trim()) return;
    setIsLoading(true);
    setItems([]);
    setTitle('');

    try {
      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aircraftType, taskType }),
      });

      const data = await res.json();
      setItems((data.items as string[]).map((text, i) => ({
        id: String(i),
        text,
        checked: false,
      })));
      setTitle(data.title ?? `${aircraftType} - ${taskType}`);
    } catch {
      alert('체크리스트 생성에 실패했습니다. API 키를 확인하세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const completedCount = items.filter(i => i.checked).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;
  const allDone = items.length > 0 && completedCount === items.length;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">정비 작업 체크리스트</h2>
        <p className="text-sm text-slate-500">항공기 종류와 작업 내용을 입력하면 AI가 체크리스트를 생성합니다</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">항공기 종류</label>
                <input
                  value={aircraftType}
                  onChange={e => setAircraftType(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generateChecklist()}
                  placeholder="예: B737-800, A320, B777"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">작업 내용</label>
                <input
                  value={taskType}
                  onChange={e => setTaskType(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generateChecklist()}
                  placeholder="예: 엔진 오일 교환, 착륙장치 점검"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={generateChecklist}
              disabled={!aircraftType.trim() || !taskType.trim() || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> 생성 중...</>
              ) : (
                <><ClipboardList className="w-4 h-4" /> 체크리스트 생성</>
              )}
            </button>
          </div>

          {items.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">{title}</h3>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-600 tabular-nums">
                    {completedCount}/{items.length}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-50">
                {items.map((item, i) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <span className="shrink-0 mt-0.5">
                      {item.checked
                        ? <CheckSquare className="w-5 h-5 text-green-500" />
                        : <Square className="w-5 h-5 text-slate-300" />}
                    </span>
                    <span className={`text-sm leading-relaxed ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      <span className="text-slate-400 font-medium mr-1.5">{i + 1}.</span>
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>

              {allDone && (
                <div className="px-5 py-4 bg-green-50 border-t border-green-100 text-sm font-medium text-green-700 text-center">
                  ✓ 모든 체크 항목이 완료되었습니다
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

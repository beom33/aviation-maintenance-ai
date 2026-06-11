'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Calendar, PlaneTakeoff, User, X } from 'lucide-react';
import type { WorkRecord } from '@/lib/types';

const STATUS_STYLE = {
  completed: 'bg-green-100 text-green-700 border-green-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  deferred: 'bg-orange-100 text-orange-700 border-orange-200',
};
const STATUS_LABEL = { completed: '완료', in_progress: '진행 중', deferred: '연기' };

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  aircraftType: '',
  taskType: '',
  description: '',
  technician: '',
  status: 'completed' as WorkRecord['status'],
};

export default function HistoryPage() {
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    const saved = localStorage.getItem('aviation-work-history');
    if (saved) {
      try { setRecords(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const persist = (next: WorkRecord[]) => {
    setRecords(next);
    localStorage.setItem('aviation-work-history', JSON.stringify(next));
  };

  const addRecord = () => {
    if (!form.aircraftType.trim() || !form.taskType.trim()) return;
    persist([{ ...form, id: Date.now().toString() }, ...records]);
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const deleteRecord = (id: string) => {
    if (confirm('이 기록을 삭제하시겠습니까?')) persist(records.filter(r => r.id !== id));
  };

  const filtered = search.trim()
    ? records.filter(r => {
        const q = search.toLowerCase();
        return r.aircraftType.toLowerCase().includes(q) ||
          r.taskType.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.technician.toLowerCase().includes(q);
      })
    : records;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">작업 이력 기록/조회</h2>
        <p className="text-sm text-slate-500">정비 작업 내역을 기록하고 검색합니다 (브라우저 로컬에 저장)</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="항공기, 작업 내용, 기술자 이름 검색..."
                className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? '취소' : '기록 추가'}
            </button>
          </div>

          {showForm && (
            <div className="bg-white border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">새 작업 기록</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">날짜</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">항공기 종류 *</label>
                  <input
                    value={form.aircraftType}
                    onChange={e => setForm({ ...form, aircraftType: e.target.value })}
                    placeholder="예: B737-800"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">작업 종류 *</label>
                  <input
                    value={form.taskType}
                    onChange={e => setForm({ ...form, taskType: e.target.value })}
                    placeholder="예: 엔진 오일 교환"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">담당 기술자</label>
                  <input
                    value={form.technician}
                    onChange={e => setForm({ ...form, technician: e.target.value })}
                    placeholder="기술자 이름"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">작업 내용</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="작업 세부 내용, 사용 부품, 특이사항 등..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">상태</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as WorkRecord['status'] })}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="completed">완료</option>
                    <option value="in_progress">진행 중</option>
                    <option value="deferred">연기</option>
                  </select>
                </div>
                <button
                  onClick={addRecord}
                  disabled={!form.aircraftType.trim() || !form.taskType.trim()}
                  className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg transition-colors font-medium"
                >
                  저장
                </button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-medium text-slate-600">
                {records.length === 0 ? '아직 작업 기록이 없습니다' : '검색 결과가 없습니다'}
              </p>
              <p className="text-sm mt-1">
                {records.length === 0 ? '위의 버튼으로 첫 번째 기록을 추가하세요' : '다른 검색어를 시도해 보세요'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(record => (
                <div key={record.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[record.status]}`}>
                          {STATUS_LABEL[record.status]}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{record.date}
                        </span>
                        {record.technician && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3" />{record.technician}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <PlaneTakeoff className="w-4 h-4 text-blue-500 shrink-0" />
                          {record.aircraftType}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-700 font-medium truncate">{record.taskType}</span>
                      </div>
                      {record.description && (
                        <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{record.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteRecord(record.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                      title="기록 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

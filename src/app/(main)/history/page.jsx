'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Calendar, PlaneTakeoff, User, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HistoryPage() {
  const { t } = useLanguage();
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    aircraftType: '',
    taskType: '',
    description: '',
    technician: '',
    status: 'completed',
  });

  useEffect(() => {
    const saved = localStorage.getItem('aviation-work-history');
    if (saved) {
      try { setRecords(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const STATUS_LABEL = {
    completed: t.history.statusCompleted,
    in_progress: t.history.statusInProgress,
    deferred: t.history.statusDeferred,
  };

  const STATUS_STYLE = {
    completed: 'bg-green-100 text-green-700 border-green-200',
    in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
    deferred: 'bg-orange-100 text-orange-700 border-orange-200',
  };

  const EMPTY_FORM = {
    date: new Date().toISOString().split('T')[0],
    aircraftType: '',
    taskType: '',
    description: '',
    technician: '',
    status: 'completed',
  };

  const persist = (next) => {
    setRecords(next);
    localStorage.setItem('aviation-work-history', JSON.stringify(next));
  };

  const addRecord = () => {
    if (!form.aircraftType.trim() || !form.taskType.trim()) return;
    persist([{ ...form, id: Date.now().toString() }, ...records]);
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const deleteRecord = (id) => {
    if (confirm(t.history.deleteConfirm)) persist(records.filter(r => r.id !== id));
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
        <h2 className="text-lg font-semibold text-slate-800">{t.history.title}</h2>
        <p className="text-sm text-slate-500">{t.history.subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.history.searchPlaceholder}
                className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? t.history.cancel : t.history.addRecord}
            </button>
          </div>

          {showForm && (
            <div className="bg-white border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">{t.history.newRecord}</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t.history.date}</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t.history.aircraftType}</label>
                  <input
                    value={form.aircraftType}
                    onChange={e => setForm({ ...form, aircraftType: e.target.value })}
                    placeholder={t.history.aircraftPlaceholder}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t.history.taskType}</label>
                  <input
                    value={form.taskType}
                    onChange={e => setForm({ ...form, taskType: e.target.value })}
                    placeholder={t.history.taskPlaceholder}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t.history.technician}</label>
                  <input
                    value={form.technician}
                    onChange={e => setForm({ ...form, technician: e.target.value })}
                    placeholder={t.history.technicianPlaceholder}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">{t.history.taskDesc}</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder={t.history.taskDescPlaceholder}
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t.history.status}</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="completed">{t.history.statusCompleted}</option>
                    <option value="in_progress">{t.history.statusInProgress}</option>
                    <option value="deferred">{t.history.statusDeferred}</option>
                  </select>
                </div>
                <button
                  onClick={addRecord}
                  disabled={!form.aircraftType.trim() || !form.taskType.trim()}
                  className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-lg transition-colors font-medium"
                >
                  {t.history.save}
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
                {records.length === 0 ? t.history.noRecords : t.history.noResults}
              </p>
              <p className="text-sm mt-1">
                {records.length === 0 ? t.history.noRecordsHint : t.history.noResultsHint}
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
                      title={t.history.deleteTitle}
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

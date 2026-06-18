'use client';

import { useState, useEffect } from 'react';
import { Plane, Building2, Shield, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';

const ROLE_COLOR = {
  ADMIN: 'bg-red-100 text-red-700 border-red-200',
  SUPERVISOR: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  TECHNICIAN: 'bg-green-100 text-green-700 border-green-200',
};

export default function DashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError('데이터를 불러오는데 실패했습니다'))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteAccount = async () => {
    if (!confirm(t.dashboard.deleteConfirm)) return;
    setDeleting(true);
    try {
      await fetch('/api/user/delete', { method: 'DELETE' });
      await signOut({ callbackUrl: '/login' });
    } catch {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const { user, totalAircraft, assignments } = data ?? {};

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">{t.dashboard.title}</h2>
        <p className="text-sm text-slate-500">{t.dashboard.subtitle}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* 프로필 카드 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-bold">{user?.name}</h3>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-white/90 ${ROLE_COLOR[user?.role]}`}>
                    {t.role[user?.role]}
                  </span>
                </div>
                <p className="text-blue-100 text-sm">{t.dashboard.employeeId}: {user?.employeeId}</p>
                <p className="text-blue-100 text-sm">{user?.email}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tracking-wide">{user?.airline?.code}</div>
                <div className="text-blue-100 text-sm">{user?.airline?.name}</div>
                <div className="text-blue-200 text-xs">{user?.airline?.nameEn}</div>
              </div>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-600">{t.dashboard.airlineSection}</span>
              </div>
              <p className="text-xl font-bold text-slate-800">{user?.airline?.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{user?.airline?.nameEn}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Plane className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-slate-600">{t.dashboard.totalAircraft}</span>
              </div>
              <p className="text-4xl font-bold text-slate-800">{totalAircraft}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t.dashboard.unit}</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-slate-600">{t.dashboard.myAircraft}</span>
              </div>
              <p className="text-4xl font-bold text-slate-800">{assignments?.length ?? 0}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t.dashboard.assignedUnit}</p>
            </div>
          </div>

          {/* 담당 항공기 목록 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Plane className="w-4 h-4 text-blue-500" />
                {t.dashboard.aircraftList}
              </h3>
            </div>
            {!assignments?.length ? (
              <div className="py-12 text-center text-slate-400">
                <Plane className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                <p className="text-sm font-medium text-slate-500">{t.dashboard.noAircraft}</p>
                <p className="text-xs mt-1">{t.dashboard.noAircraftHint}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {assignments.map((aircraft) => (
                  <div key={aircraft.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <Plane className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 font-mono">{aircraft.registration}</p>
                      <p className="text-sm text-slate-500">{aircraft.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-600">{aircraft.manufacturer}</p>
                      <p className="text-xs text-slate-400">{aircraft.airline?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 계정 탈퇴 */}
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-1">{t.dashboard.deleteAccount}</h3>
            <p className="text-xs text-slate-400 mb-4">{t.dashboard.deleteHint}</p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? t.processing : t.dashboard.deleteButton}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

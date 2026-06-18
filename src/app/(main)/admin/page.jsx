'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Plane, Link2, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ROLE_COLOR = { ADMIN: 'bg-red-100 text-red-700', SUPERVISOR: 'bg-yellow-100 text-yellow-700', TECHNICIAN: 'bg-green-100 text-green-700' };

export default function AdminPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [aircraft, setAircraft] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [acForm, setAcForm] = useState({ registration: '', type: '', manufacturer: '', airlineId: '' });
  const [asForm, setAsForm] = useState({ userId: '', aircraftId: '' });

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 3000); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [u, a, as, al] = await Promise.all([
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/aircraft').then((r) => r.json()),
        fetch('/api/admin/assignments').then((r) => r.json()),
        fetch('/api/airlines').then((r) => r.json()),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setAircraft(Array.isArray(a) ? a : []);
      setAssignments(Array.isArray(as) ? as : []);
      setAirlines(Array.isArray(al) ? al : []);
    } catch { showMsg('error', t.admin.msgLoadFail); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const changeRole = async (id, role) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    if (res.ok) { setUsers((u) => u.map((x) => x.id === id ? { ...x, role } : x)); showMsg('success', t.admin.msgRoleChanged); }
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`${name} ${t.admin.deleteUserConfirm}`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) { setUsers((u) => u.filter((x) => x.id !== id)); showMsg('success', t.admin.msgUserDeleted); }
    else showMsg('error', data.error ?? t.admin.msgDeleteFail);
  };

  const addAircraft = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/aircraft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(acForm) });
    const data = await res.json();
    if (res.ok) { setAcForm({ registration: '', type: '', manufacturer: '', airlineId: '' }); showMsg('success', t.admin.msgAircraftAdded); fetchAll(); }
    else showMsg('error', data.error ?? t.admin.msgDeleteFail);
  };

  const addAssignment = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(asForm) });
    const data = await res.json();
    if (res.ok) { setAsForm({ userId: '', aircraftId: '' }); showMsg('success', t.admin.msgAssigned); fetchAll(); }
    else showMsg('error', data.error ?? t.admin.msgDeleteFail);
  };

  const deleteAssignment = async (id) => {
    const res = await fetch('/api/admin/assignments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { setAssignments((a) => a.filter((x) => x.id !== id)); showMsg('success', t.admin.msgUnassigned); }
  };

  const TABS = [
    { id: 'users', label: t.admin.tabUsers, icon: Users },
    { id: 'aircraft', label: t.admin.tabAircraft, icon: Plane },
    { id: 'assignments', label: t.admin.tabAssignments, icon: Link2 },
  ];

  const inputCls = 'border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">{t.admin.title}</h2>
        <p className="text-sm text-slate-500">{t.admin.subtitle}</p>
      </div>

      {msg.text && (
        <div className={`mx-6 mt-4 shrink-0 flex items-center gap-2 p-3 rounded-xl text-sm border ${msg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      <div className="px-6 pt-4 shrink-0">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40"><RefreshCw className="w-5 h-5 animate-spin text-blue-500" /></div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-5">

            {/* 회원 관리 */}
            {tab === 'users' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                  <span className="text-sm font-semibold text-slate-600">{t.admin.totalUsers} {users.length}{t.admin.unit}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.admin.colNameEmail}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.admin.colEmployeeId}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.admin.colAirline}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.admin.colRole}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{t.admin.colJoinDate}</th>
                      <th className="px-4 py-3"></th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3"><p className="font-medium text-slate-800">{u.name}</p><p className="text-xs text-slate-400">{u.email}</p></td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.employeeId}</td>
                          <td className="px-4 py-3"><span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono mr-1">{u.airlineCode}</span><span className="text-slate-600 text-xs">{u.airline}</span></td>
                          <td className="px-4 py-3">
                            <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                              className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer ${ROLE_COLOR[u.role]}`}>
                              <option value="TECHNICIAN">{t.role.TECHNICIAN}</option>
                              <option value="SUPERVISOR">{t.role.SUPERVISOR}</option>
                              <option value="ADMIN">{t.role.ADMIN}</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => deleteUser(u.id, u.name)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 항공기 관리 */}
            {tab === 'aircraft' && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">{t.admin.addAircraft}</h3>
                  <form onSubmit={addAircraft} className="grid grid-cols-4 gap-3">
                    <input placeholder={t.admin.regPlaceholder} value={acForm.registration} onChange={(e) => setAcForm((p) => ({ ...p, registration: e.target.value }))} required className={inputCls} />
                    <input placeholder={t.admin.typePlaceholder} value={acForm.type} onChange={(e) => setAcForm((p) => ({ ...p, type: e.target.value }))} required className={inputCls} />
                    <input placeholder={t.admin.mfrPlaceholder} value={acForm.manufacturer} onChange={(e) => setAcForm((p) => ({ ...p, manufacturer: e.target.value }))} required className={inputCls} />
                    <select value={acForm.airlineId} onChange={(e) => setAcForm((p) => ({ ...p, airlineId: e.target.value }))} required className={inputCls + ' bg-white'}>
                      <option value="">{t.admin.airlineSelect}</option>
                      {airlines.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <button type="submit" className="col-span-4 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                      <Plus className="w-4 h-4" />{t.admin.register}
                    </button>
                  </form>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50"><span className="text-sm font-semibold text-slate-600">{t.admin.totalAircraft} {aircraft.length}{t.admin.aircraftUnit}</span></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-100">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.admin.colRegistration}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.admin.colType}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.admin.colManufacturer}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.admin.colAirline}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.admin.colAssignee}</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {aircraft.map((ac) => (
                          <tr key={ac.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-mono font-semibold text-slate-800">{ac.registration}</td>
                            <td className="px-4 py-3 text-slate-600">{ac.type}</td>
                            <td className="px-4 py-3 text-slate-500">{ac.manufacturer}</td>
                            <td className="px-4 py-3 text-slate-500">{ac.airline?.name}</td>
                            <td className="px-4 py-3">
                              {ac.assignments?.length > 0
                                ? ac.assignments.map((a) => <span key={a.id} className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full mr-1">{a.user?.name}</span>)
                                : <span className="text-xs text-slate-300">{t.admin.unassigned}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* 배정 관리 */}
            {tab === 'assignments' && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">{t.admin.addAssignment}</h3>
                  <form onSubmit={addAssignment} className="grid grid-cols-3 gap-3">
                    <select value={asForm.userId} onChange={(e) => setAsForm((p) => ({ ...p, userId: e.target.value }))} required className={inputCls + ' bg-white'}>
                      <option value="">{t.admin.technicianSelect}</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.airline})</option>)}
                    </select>
                    <select value={asForm.aircraftId} onChange={(e) => setAsForm((p) => ({ ...p, aircraftId: e.target.value }))} required className={inputCls + ' bg-white'}>
                      <option value="">{t.admin.aircraftSelect}</option>
                      {aircraft.map((a) => <option key={a.id} value={a.id}>{a.registration} - {a.type} ({a.airline?.name})</option>)}
                    </select>
                    <button type="submit" className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                      <Plus className="w-4 h-4" />{t.admin.assign}
                    </button>
                  </form>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50"><span className="text-sm font-semibold text-slate-600">{t.admin.totalAssignments} {assignments.length}{t.admin.assignmentUnit}</span></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-100">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.admin.colTechnician}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.admin.colAircraftCol}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.admin.colAirline}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{t.admin.colAssignDate}</th>
                        <th className="px-4 py-3"></th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {assignments.map((as) => (
                          <tr key={as.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3"><p className="font-medium text-slate-800">{as.user?.name}</p><p className="text-xs text-slate-400">{as.user?.airline?.name}</p></td>
                            <td className="px-4 py-3"><p className="font-mono font-semibold text-slate-800">{as.aircraft?.registration}</p><p className="text-xs text-slate-400">{as.aircraft?.type}</p></td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{as.aircraft?.airline?.name}</td>
                            <td className="px-4 py-3 text-xs text-slate-400">{new Date(as.assignedAt).toLocaleDateString('ko-KR')}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => deleteAssignment(as.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

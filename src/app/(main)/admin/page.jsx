'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Plane, Link2, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const TABS = [
  { id: 'users', label: '회원 관리', icon: Users },
  { id: 'aircraft', label: '항공기 관리', icon: Plane },
  { id: 'assignments', label: '배정 관리', icon: Link2 },
];
const ROLE_COLOR = { ADMIN: 'bg-red-100 text-red-700', SUPERVISOR: 'bg-yellow-100 text-yellow-700', TECHNICIAN: 'bg-green-100 text-green-700' };

export default function AdminPage() {
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
    } catch { showMsg('error', '데이터 로드 실패'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const changeRole = async (id, role) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    if (res.ok) { setUsers((u) => u.map((x) => x.id === id ? { ...x, role } : x)); showMsg('success', '역할이 변경되었습니다'); }
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`${name} 회원을 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) { setUsers((u) => u.filter((x) => x.id !== id)); showMsg('success', '회원이 삭제되었습니다'); }
    else showMsg('error', data.error ?? '삭제에 실패했습니다');
  };

  const addAircraft = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/aircraft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(acForm) });
    const data = await res.json();
    if (res.ok) { setAcForm({ registration: '', type: '', manufacturer: '', airlineId: '' }); showMsg('success', '항공기가 등록되었습니다'); fetchAll(); }
    else showMsg('error', data.error ?? '등록 실패');
  };

  const addAssignment = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(asForm) });
    const data = await res.json();
    if (res.ok) { setAsForm({ userId: '', aircraftId: '' }); showMsg('success', '배정되었습니다'); fetchAll(); }
    else showMsg('error', data.error ?? '배정 실패');
  };

  const deleteAssignment = async (id) => {
    const res = await fetch('/api/admin/assignments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { setAssignments((a) => a.filter((x) => x.id !== id)); showMsg('success', '배정이 해제되었습니다'); }
  };

  const inputCls = 'border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">관리자 패널</h2>
        <p className="text-sm text-slate-500">회원 관리, 항공기 등록, 담당 배정</p>
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
                  <span className="text-sm font-semibold text-slate-600">전체 회원 {users.length}명</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">이름 / 이메일</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">사번</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">항공사</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">역할</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">가입일</th>
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
                              <option value="TECHNICIAN">정비사</option>
                              <option value="SUPERVISOR">감독관</option>
                              <option value="ADMIN">관리자</option>
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
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">새 항공기 등록</h3>
                  <form onSubmit={addAircraft} className="grid grid-cols-4 gap-3">
                    <input placeholder="등록번호 (HL7456)" value={acForm.registration} onChange={(e) => setAcForm((p) => ({ ...p, registration: e.target.value }))} required className={inputCls} />
                    <input placeholder="기종 (B737-800)" value={acForm.type} onChange={(e) => setAcForm((p) => ({ ...p, type: e.target.value }))} required className={inputCls} />
                    <input placeholder="제조사 (Boeing)" value={acForm.manufacturer} onChange={(e) => setAcForm((p) => ({ ...p, manufacturer: e.target.value }))} required className={inputCls} />
                    <select value={acForm.airlineId} onChange={(e) => setAcForm((p) => ({ ...p, airlineId: e.target.value }))} required className={inputCls + ' bg-white'}>
                      <option value="">항공사 선택</option>
                      {airlines.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <button type="submit" className="col-span-4 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                      <Plus className="w-4 h-4" />등록
                    </button>
                  </form>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50"><span className="text-sm font-semibold text-slate-600">전체 항공기 {aircraft.length}대</span></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-100">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">등록번호</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">기종</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">제조사</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">항공사</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">담당 정비사</th>
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
                                : <span className="text-xs text-slate-300">미배정</span>}
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
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">담당 항공기 배정</h3>
                  <form onSubmit={addAssignment} className="grid grid-cols-3 gap-3">
                    <select value={asForm.userId} onChange={(e) => setAsForm((p) => ({ ...p, userId: e.target.value }))} required className={inputCls + ' bg-white'}>
                      <option value="">정비사 선택</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.airline})</option>)}
                    </select>
                    <select value={asForm.aircraftId} onChange={(e) => setAsForm((p) => ({ ...p, aircraftId: e.target.value }))} required className={inputCls + ' bg-white'}>
                      <option value="">항공기 선택</option>
                      {aircraft.map((a) => <option key={a.id} value={a.id}>{a.registration} - {a.type} ({a.airline?.name})</option>)}
                    </select>
                    <button type="submit" className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                      <Plus className="w-4 h-4" />배정
                    </button>
                  </form>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50"><span className="text-sm font-semibold text-slate-600">현재 배정 {assignments.length}건</span></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-100">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">정비사</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">항공기</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">항공사</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">배정일</th>
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

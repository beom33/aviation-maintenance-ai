'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wrench, Mail, Lock, User, Building2, CreditCard, AlertCircle, Loader2, CheckCircle2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SignupPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [airlines, setAirlines] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', employeeId: '', airlineId: '', adminCode: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successRole, setSuccessRole] = useState('TECHNICIAN');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/airlines').then((r) => r.json()).then(setAirlines).catch(() => {});
  }, []);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError(t.signup.errorPassword); return; }
    if (form.password.length < 6) { setError(t.signup.errorPasswordLength); return; }

    setLoading(true);
    try {
      const body = { name: form.name, email: form.email, password: form.password, employeeId: form.employeeId, airlineId: form.airlineId };
      if (isAdmin && form.adminCode) body.adminCode = form.adminCode;

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t.signup.errorFail); return; }
      setSuccessRole(data.role);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch {
      setError(t.signup.errorServer);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          {successRole === 'ADMIN' ? (
            <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
          ) : (
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.signup.successTitle}</h2>
          {successRole === 'ADMIN' && (
            <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-3">{t.signup.adminBadge}</span>
          )}
          <p className="text-slate-500">{t.signup.successMsg}</p>
        </div>
      </div>
    );
  }

  const inputClass = 'w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{t.signup.title}</h1>
          <p className="text-slate-500 text-sm mt-1">{t.signup.subtitle}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">{t.signup.name}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" value={form.name} onChange={set('name')} placeholder={t.signup.namePlaceholder} required className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t.signup.airline}</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <select value={form.airlineId} onChange={set('airlineId')} required className={inputClass + ' bg-white'}>
                  <option value="">{t.signup.airlineSelect}</option>
                  {airlines.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t.signup.employeeId}</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" value={form.employeeId} onChange={set('employeeId')} placeholder={t.signup.employeeIdPlaceholder} required className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">{t.signup.email}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="email" value={form.email} onChange={set('email')} placeholder={t.signup.emailPlaceholder} required className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t.signup.password}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="password" value={form.password} onChange={set('password')} placeholder={t.signup.passwordPlaceholder} required className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t.signup.confirmPassword}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••" required className={inputClass} />
              </div>
            </div>
          </div>

          {/* 관리자 코드 섹션 */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => { setIsAdmin(!isAdmin); setForm((p) => ({ ...p, adminCode: '' })); }}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${isAdmin ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {t.signup.adminToggle}
              </span>
              {isAdmin ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isAdmin && (
              <div className="px-4 py-3 border-t border-red-100 bg-red-50/50">
                <label className="block text-xs font-medium text-red-700 mb-1.5">{t.signup.adminCode}</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-400" />
                  <input
                    type="password"
                    value={form.adminCode}
                    onChange={set('adminCode')}
                    placeholder={t.signup.adminCodePlaceholder}
                    required={isAdmin}
                    className="w-full pl-9 pr-4 py-2.5 border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                  />
                </div>
                <p className="text-xs text-red-500 mt-1.5">{t.signup.adminCodeHint}</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-1 ${isAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{t.signup.loading}</> : isAdmin ? t.signup.adminButton : t.signup.button}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          {t.signup.hasAccount}{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">{t.signup.loginLink}</Link>
        </p>
      </div>
    </div>
  );
}

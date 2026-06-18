'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  MessageSquare, CheckSquare, AlertTriangle, History, Wrench,
  FileText, ClipboardList, LayoutDashboard, LogOut, ShieldCheck, Plane, Languages,
} from 'lucide-react';

const ROLE_BG = { ADMIN: 'bg-red-500', SUPERVISOR: 'bg-yellow-500', TECHNICIAN: 'bg-blue-500' };

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const { t, locale, toggle } = useLanguage();

  const navItems = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { href: '/chat', label: t.nav.chat, icon: MessageSquare },
    { href: '/checklist', label: t.nav.checklist, icon: CheckSquare },
    { href: '/fault-code', label: t.nav.faultCode, icon: AlertTriangle },
    { href: '/history', label: t.nav.history, icon: History },
    { href: '/report', label: t.nav.report, icon: ClipboardList },
    { href: '/documents', label: t.nav.documents, icon: FileText },
  ];

  return (
    <aside className="w-64 bg-slate-800 text-white flex flex-col h-full shrink-0">
      {/* 로고 */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">{t.appName}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{t.appSub}</p>
          </div>
        </div>
      </div>

      {/* 사용자 정보 */}
      {user && (
        <div className="px-4 py-3 border-b border-slate-700 bg-slate-700/40">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold shrink-0">
              {user.name?.[0] ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{t.nav.employeeId} {user.employeeId}</p>
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${ROLE_BG[user.role] ?? 'bg-slate-500'}`}>
              {t.role[user.role]}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Plane className="w-3 h-3 shrink-0" />
            <span className="truncate">{user.airlineName}</span>
            <span className="ml-auto font-mono text-slate-500 shrink-0">{user.airlineCode}</span>
          </div>
        </div>
      )}

      {/* 네비게이션 */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === href
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}

        {user?.role === 'ADMIN' && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2 ${
              pathname === '/admin'
                ? 'bg-red-600 text-white'
                : 'text-red-400 hover:bg-slate-700 hover:text-red-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            {t.nav.adminPanel}
          </Link>
        )}
      </nav>

      {/* 하단 */}
      <div className="p-3 border-t border-slate-700 space-y-1">
        {/* 언어 전환 버튼 */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <Languages className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">{locale === 'ko' ? 'English' : '한국어'}</span>
          <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded font-mono">
            {locale === 'ko' ? 'EN' : 'KO'}
          </span>
        </button>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {t.nav.logout}
        </button>
        <p className="text-[11px] text-slate-600 px-3 mt-1">{t.poweredBy}</p>
      </div>
    </aside>
  );
}

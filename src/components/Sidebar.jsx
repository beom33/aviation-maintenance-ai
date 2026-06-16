'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  MessageSquare, CheckSquare, AlertTriangle, History, Wrench,
  FileText, ClipboardList, LayoutDashboard, LogOut, ShieldCheck, Plane,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/chat', label: '매뉴얼 Q&A', icon: MessageSquare },
  { href: '/checklist', label: '작업 체크리스트', icon: CheckSquare },
  { href: '/fault-code', label: '결함 코드 분석', icon: AlertTriangle },
  { href: '/history', label: '작업 이력', icon: History },
  { href: '/report', label: '정비 보고서', icon: ClipboardList },
  { href: '/documents', label: '문서 관리', icon: FileText },
];

const ROLE_LABEL = { ADMIN: '관리자', SUPERVISOR: '감독관', TECHNICIAN: '정비사' };
const ROLE_BG = { ADMIN: 'bg-red-500', SUPERVISOR: 'bg-yellow-500', TECHNICIAN: 'bg-blue-500' };

export default function Sidebar({ user }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-800 text-white flex flex-col h-full shrink-0">
      {/* 로고 */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">항공정비 AI 비서</h1>
            <p className="text-xs text-slate-400 mt-0.5">Aviation Maintenance AI</p>
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
              <p className="text-xs text-slate-400 truncate">사번 {user.employeeId}</p>
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${ROLE_BG[user.role] ?? 'bg-slate-500'}`}>
              {ROLE_LABEL[user.role]}
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
            관리자 패널
          </Link>
        )}
      </nav>

      {/* 하단 */}
      <div className="p-3 border-t border-slate-700">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          로그아웃
        </button>
        <p className="text-[11px] text-slate-600 px-3 mt-2">Powered by GROQ</p>
      </div>
    </aside>
  );
}

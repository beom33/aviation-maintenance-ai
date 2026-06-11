'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, CheckSquare, AlertTriangle, History, Wrench } from 'lucide-react';

const navItems = [
  { href: '/chat', label: '매뉴얼 Q&A', icon: MessageSquare },
  { href: '/checklist', label: '작업 체크리스트', icon: CheckSquare },
  { href: '/fault-code', label: '결함 코드 분석', icon: AlertTriangle },
  { href: '/history', label: '작업 이력', icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-800 text-white flex flex-col h-full shrink-0">
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

      <nav className="flex-1 p-3 space-y-1">
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
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">Powered by GROQ </p>
      </div>
    </aside>
  );
}

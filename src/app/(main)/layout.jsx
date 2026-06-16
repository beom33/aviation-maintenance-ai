import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default async function MainLayout({ children }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="h-full flex bg-slate-50">
      <Sidebar user={session.user} />
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}

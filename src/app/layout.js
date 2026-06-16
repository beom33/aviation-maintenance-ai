import './globals.css';
import { auth } from '@/auth';
import Providers from '@/components/Providers';

export const metadata = {
  title: '항공정비 AI 비서',
  description: '항공 정비 작업을 지원하는 AI 어시스턴트',
};

export default async function RootLayout({ children }) {
  const session = await auth();
  return (
    <html lang="ko" className="h-full">
      <body className="h-full antialiased">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}

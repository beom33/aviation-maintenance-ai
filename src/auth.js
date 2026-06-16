import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
          include: { airline: true },
        });

        if (!user) return null;
        const valid = await bcrypt.compare(String(credentials.password), user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          airlineId: user.airlineId,
          airlineName: user.airline.name,
          airlineNameEn: user.airline.nameEn,
          airlineCode: user.airline.code,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const { pathname } = request.nextUrl;

      if (pathname.startsWith('/api/auth') || pathname === '/api/airlines') {
        return true;
      }

      if (pathname.startsWith('/api/')) {
        if (!isLoggedIn) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (pathname.startsWith('/api/admin') && session?.user?.role !== 'ADMIN') {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return true;
      }

      if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', request.nextUrl));
        return true;
      }

      if (!isLoggedIn) return false;

      if (pathname.startsWith('/admin') && session?.user?.role !== 'ADMIN') {
        return Response.redirect(new URL('/dashboard', request.nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.employeeId = user.employeeId;
        token.airlineId = user.airlineId;
        token.airlineName = user.airlineName;
        token.airlineNameEn = user.airlineNameEn;
        token.airlineCode = user.airlineCode;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.employeeId = token.employeeId;
      session.user.airlineId = token.airlineId;
      session.user.airlineName = token.airlineName;
      session.user.airlineNameEn = token.airlineNameEn;
      session.user.airlineCode = token.airlineCode;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
});

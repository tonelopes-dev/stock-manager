import { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// We import types/enums but NOT the database client itself here
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      companyId: string;
      role: UserRole;
      subscriptionStatus?: string | null;
      companyDeletedAt?: string | null;
    };
  }

  interface User {
    companyId?: string;
    role?: UserRole;
    sessionVersion?: number;
    subscriptionStatus?: string | null;
    companyDeletedAt?: string | null;
  }

  interface JWT {
    id: string;
    companyId: string;
    role: UserRole;
    sessionVersion: number;
    subscriptionStatus?: string | null;
    companyDeletedAt?: string | null;
  }
}

export const authConfig = {
  providers: [], // Providers are defined in the full auth.ts to avoid Prisma Edge issues
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Only basic JWT handling here. No Prisma lookups.
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.sessionVersion = user.sessionVersion ?? 0;
      }

      if (trigger === "update" && session) {
        token.companyId = session.user.companyId;
        token.role = session.user.role;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.companyId = token.companyId as string;
        session.user.role = token.role as UserRole;
        session.user.subscriptionStatus = token.subscriptionStatus as string | null;
        session.user.companyDeletedAt = token.companyDeletedAt as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;

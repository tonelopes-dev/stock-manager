import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./prisma";

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

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.sessionVersion = (user as { sessionVersion?: number }).sessionVersion ?? 0;
      }


      // Handle manual updates (trigger "update")
      if (trigger === "update" && session) {
        token.companyId = session.user.companyId;
        token.role = session.user.role;
      }

      // Always ensure companyId and role are in token, and validate sessionVersion
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { 
            sessionVersion: true,
            userCompanies: {
              select: { 
                companyId: true, 
                role: true,
                company: {
                  select: {
                    subscriptionStatus: true,
                    deletedAt: true
                  }
                }
              },
              take: 1
            }
          }
        }) as { sessionVersion: number; userCompanies: { companyId: string; role: UserRole; company: { subscriptionStatus: string | null; deletedAt: Date | null } }[] } | null;


        // Real Session Invalidation: 
        // If DB version is higher than token version, the session is toast.
        if (!dbUser || dbUser.sessionVersion > (token.sessionVersion as number)) {
          return null; // This will trigger signOut/unauthorized
        }

        if (!token.companyId || !token.role || trigger === "update") {
          const userCompany = dbUser.userCompanies[0];
          token.companyId = userCompany?.companyId ?? "";
          token.role = userCompany?.role ?? UserRole.MEMBER;
          token.subscriptionStatus = userCompany?.company?.subscriptionStatus ?? null;
          token.companyDeletedAt = userCompany?.company?.deletedAt?.toISOString() ?? null;
        }
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
});



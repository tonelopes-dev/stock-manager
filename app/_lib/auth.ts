import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./prisma";
import { authConfig } from "./auth.config";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
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
          console.log("[Auth] User not found or has no password:", credentials.email);
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          console.log("[Auth] Password mismatch for:", credentials.email);
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
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      // 1. Base callback handles user -> token mapping on sign in
      if (user) {
        token.id = user.id;
        token.sessionVersion = (user as any).sessionVersion ?? 0;
      }

      // 2. Handle manual updates from useSession().update()
      if (trigger === "update" && session) {
        token.companyId = session.user.companyId;
        token.role = session.user.role;
      }

      if (!token.id) return token;

      // 3. Fetch fresh data and validate session version (Node.js runtime only)
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
                  deletedAt: true,
                }
              }
            },
            take: 1
          }
        }
      });

      if (!dbUser || dbUser.sessionVersion > (token.sessionVersion as number)) {
        console.log("[Auth] Session invalidated for user:", token.id);
        return null; // Force sign out
      }

      // 4. Populate missing fields
      const userCompany = dbUser.userCompanies[0];
      token.companyId = userCompany?.companyId ?? "";
      token.role = userCompany?.role ?? UserRole.MEMBER;
      token.subscriptionStatus = userCompany?.company?.subscriptionStatus ?? null;
      token.companyDeletedAt = userCompany?.company?.deletedAt?.toISOString() ?? null;

      return token;
    }
  },
});




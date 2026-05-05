import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { verifyPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit/audit-log";

const credentialsSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8)
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 12,
    updateAge: 60 * 15
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/en/login"
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const limited = checkRateLimit(`login:${email}`, 8, 15 * 60 * 1000);
        if (!limited.allowed) {
          throw new Error("errors.rateLimited");
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            preferredLocale: true,
            failedLoginCount: true,
            lockedUntil: true,
            deletedAt: true
          }
        });

        if (!user || user.deletedAt || !user.passwordHash) return null;

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("errors.accountLocked");
        }

        const valid = await verifyPassword(user.passwordHash, password);

        if (!valid) {
          const failedLoginCount = user.failedLoginCount + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount,
              lockedUntil:
                failedLoginCount >= 10
                  ? new Date(Date.now() + 30 * 60 * 1000)
                  : null
            }
          });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: 0,
            lockedUntil: null,
            lastLoginAt: new Date()
          }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          preferredLocale: user.preferredLocale
        };
      }
    })
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.preferredLocale = (user as { preferredLocale?: string }).preferredLocale ?? "en";
      }
      if (trigger === "update" && session?.user?.preferredLocale) {
        token.preferredLocale = session.user.preferredLocale;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.preferredLocale = (token.preferredLocale as string | undefined) ?? "en";
      }
      return session;
    }
  },
  events: {
    async signIn({ user }) {
      const membership = await prisma.membership.findFirst({
        where: { userId: user.id, status: "ACTIVE", deletedAt: null },
        orderBy: { createdAt: "asc" }
      });

      if (membership) {
        await writeAuditLog({
          tenantId: membership.tenantId,
          actorUserId: user.id,
          action: "auth.login",
          entityType: "User",
          entityId: user.id
        });
      }
    }
  }
});

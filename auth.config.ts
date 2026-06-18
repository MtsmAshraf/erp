import type { NextAuthConfig } from "next-auth"

// 👇 This object contains ONLY Edge-safe configuration.
// No database calls, no bcryptjs, no Prisma.
export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        // We cast to any here to satisfy the Edge runtime bundler, 
        // but the global types in types/next-auth.d.ts will keep it type-safe in your app.
        session.user.role = token.role as any 
      }
      return session
    },
  },
  providers: [], // 👈 Empty array keeps this file completely Edge-safe
} satisfies NextAuthConfig
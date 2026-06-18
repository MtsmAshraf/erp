import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig, // Spread the Edge-safe config first
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null

        // 👇 DYNAMIC IMPORT: 
        // This file runs in the Node.js runtime (API routes), so Prisma is safe here.
        // Because middleware.ts NO LONGER imports this file, Prisma will NEVER 
        // be bundled for the Edge runtime.
        const { prisma } = await import("@/app/lib/prisma")

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) return null

        const isPasswordValid = await compare(credentials.password as string, user.password)
        if (!isPasswordValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
})
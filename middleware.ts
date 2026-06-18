import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

// 👇 CRITICAL FIX: 
// We initialize a SEPARATE, lightweight instance of NextAuth using ONLY auth.config.ts.
// This completely prevents auth.ts (which contains bcryptjs and Prisma) from being 
// bundled into the Edge runtime middleware.
export default NextAuth(authConfig).auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith("/login")
  const isRootPage = req.nextUrl.pathname === "/"

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (isLoggedIn && isRootPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
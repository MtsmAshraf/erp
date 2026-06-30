import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { prisma } from "./prisma"

/**
 * Checks if the user is logged in and has one of the allowed roles.
 * If not, redirects them away.
 */
export async function requireRole(...allowedRoles: Role[]) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }
  
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard") 
  }
  
  return session
}

/**
 * Fetches the current user's permissions from the database.
 * Returns null if user is not logged in.
 */
export async function getUserPermissions() {
  const session = await auth()
  
  if (!session?.user) {
    return null
  }
  
  const permission = await prisma.permission.findUnique({
    where: { userId: session.user.id }
  })
  
  return permission
}

/**
 * Checks if the user has a specific permission.
 * Redirects to dashboard if they don't have it.
 */
export async function requirePermission(permissionKey: keyof import("@prisma/client").Permission) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }
  
  const permission = await prisma.permission.findUnique({
    where: { userId: session.user.id }
  })
  
  if (!permission || !permission[permissionKey]) {
    redirect("/dashboard")
  }
  
  return session
}
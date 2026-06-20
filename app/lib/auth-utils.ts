import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"

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
    // If they don't have permission, kick them back to the dashboard
    redirect("/dashboard") 
  }
  
  return session
}
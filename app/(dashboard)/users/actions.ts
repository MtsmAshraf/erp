"use server"

import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { hash } from "bcryptjs"

export async function createUser(formData: FormData) {
  // STRICTLY ADMIN ONLY
  await requireRole("ADMIN")
  
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as "ADMIN" | "STAFF"

  const hashedPassword = await hash(password, 10)

  try {
    await prisma.user.create({
      data: { name, email, password: hashedPassword, role }
    })
  } catch (error: any) {
    // Prisma throws P2002 if a unique constraint (like email) is violated
    if (error.code === 'P2002') {
      throw new Error("A user with this email already exists.")
    }
    throw error
  }

  revalidatePath("/users")
  redirect("/users")
}

export async function deleteUser(formData: FormData) {
  const session = await requireRole("ADMIN")
  const userId = formData.get("userId") as string

  // SAFEGUARD 1: Prevent admin from deleting themselves
  if (userId === session.user.id) {
    throw new Error("You cannot delete your own account.")
  }

  const userToDelete = await prisma.user.findUnique({ where: { id: userId } })
  
  // SAFEGUARD 2: Prevent deleting the LAST admin in the system
  if (userToDelete?.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } })
    if (adminCount <= 1) {
      throw new Error("Cannot delete the last Admin user. Promote another user to Admin first.")
    }
  }

  await prisma.user.delete({ where: { id: userId } })
  revalidatePath("/users")
}
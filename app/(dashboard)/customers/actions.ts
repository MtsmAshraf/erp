"use server"

import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createCustomer(formData: FormData) {
  await requireRole("ADMIN", "STAFF")
  
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string

  await prisma.customer.create({
    data: { name, email, phone, address }
  })

  revalidatePath("/customers")
  redirect("/customers")
}
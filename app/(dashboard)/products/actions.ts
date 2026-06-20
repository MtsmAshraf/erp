"use server"

import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

/**
 * Creates a new product and optionally records an initial stock movement.
 * Uses a Prisma Transaction to ensure both happen atomically.
 */
export async function createProduct(formData: FormData) {
  // 1. Check permissions (Both Admin and Staff can create products)
  const session = await requireRole("ADMIN", "STAFF")
  const isStaff = session.user.role === "STAFF"

  // 2. Extract form data
  const sku = formData.get("sku") as string
  const name = formData.get("name") as string
  const unit = formData.get("unit") as string || "pcs"
  const description = formData.get("description") as string
  const category = formData.get("category") as string
  
  // SECURITY: If user is STAFF, force costPrice to 0 so they can't set it.
  const costPrice = isStaff ? 0 : parseFloat(formData.get("costPrice") as string) || 0
  const sellPrice = parseFloat(formData.get("sellPrice") as string) || 0
  const initialStock = parseInt(formData.get("initialStock") as string) || 0

  // 3. Execute Database Transaction
  await prisma.$transaction(async (tx) => {
    // Create the product
    const product = await tx.product.create({
      data: {
        sku,
        name,
        unit,
        description,
        category,
        costPrice,
        sellPrice,
        currentStock: initialStock, // Set the cached stock level
      },
    })

    // If initial stock > 0, create the first ledger entry
    if (initialStock > 0) {
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: "STOCK_IN",
          quantity: initialStock,
          reason: "Initial stock entry",
        },
      })
    }
  })

  // 4. Revalidate the cache so the list page updates immediately
  revalidatePath("/products")
  redirect("/products")
}

/**
 * Adds or removes stock for an existing product.
 */
export async function adjustStock(formData: FormData) {
  await requireRole("ADMIN") // Only Admins can adjust stock manually
  const productId = formData.get("productId") as string
  const type = formData.get("type") as "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT"
  const quantity = parseInt(formData.get("quantity") as string)
  const reason = formData.get("reason") as string

  if (!productId || !quantity || quantity <= 0) return

  // Calculate the actual change to apply to currentStock
  // IN adds, OUT/ADJUSTMENT subtracts
  const stockChange = type === "STOCK_IN" ? quantity : -quantity

  await prisma.$transaction(async (tx) => {
    // 1. Create the immutable ledger entry
    await tx.stockMovement.create({
      data: {
        productId,
        type,
        quantity, // Store the absolute quantity in the ledger
        reason,
      },
    })

    // 2. Update the cached currentStock on the product
    await tx.product.update({
      where: { id: productId },
      data: {
        currentStock: {
          increment: stockChange, // Atomically add/subtract
        },
      },
    })
  })

  revalidatePath(`/products/${productId}`)
  redirect(`/products/${productId}`)
}
// "use server"

// import { prisma } from "@/app/lib/prisma"
// import { requireRole } from "@/app/lib/auth-utils"
// import { revalidatePath } from "next/cache"
// import { redirect } from "next/navigation"

// /**
//  * Creates a new product and optionally records an initial stock movement.
//  * Uses a Prisma Transaction to ensure both happen atomically.
//  */
// export async function createProduct(formData: FormData) {
//   // 1. Check permissions (Both Admin and Staff can create products)
//   const session = await requireRole("ADMIN", "STAFF")
//   const isStaff = session.user.role === "STAFF"

//   // 2. Extract form data
//   const sku = formData.get("sku") as string
//   const name = formData.get("name") as string
//   const unit = formData.get("unit") as string || "pcs"
//   const description = formData.get("description") as string
//   const category = formData.get("category") as string
  
//   // SECURITY: If user is STAFF, force costPrice to 0 so they can't set it.
//   const costPrice = isStaff ? 0 : parseFloat(formData.get("costPrice") as string) || 0
//   const sellPrice = parseFloat(formData.get("sellPrice") as string) || 0
//   const initialStock = parseInt(formData.get("initialStock") as string) || 0

//   // 3. Execute Database Transaction
//   await prisma.$transaction(async (tx) => {
//     // Create the product
//     const product = await tx.product.create({
//       data: {
//         sku,
//         name,
//         unit,
//         description,
//         category,
//         costPrice,
//         // sellPrice,
//         currentStock: initialStock, // Set the cached stock level
//       },
//     })

//     // If initial stock > 0, create the first ledger entry
//     if (initialStock > 0) {
//       await tx.stockMovement.create({
//         data: {
//           productId: product.id,
//           type: "STOCK_IN",
//           quantity: initialStock,
//           reason: "Initial stock entry",
//         },
//       })
//     }
//   })

//   // 4. Revalidate the cache so the list page updates immediately
//   revalidatePath("/products")
//   redirect("/products")
// }


// export async function adjustStock(formData: FormData) {
//   await requireRole("ADMIN")
//   const productId = formData.get("productId") as string
//   const type = formData.get("type") as "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT"
//   const quantity = parseInt(formData.get("quantity") as string)
//   const reason = formData.get("reason") as string

//   if (!productId || !quantity || quantity <= 0) return

//   // Get current product to check if adjustment would make stock negative
//   const product = await prisma.product.findUnique({ where: { id: productId } })
//   if (!product) throw new Error("Product not found")

//   const stockChange = type === "STOCK_IN" ? quantity : -quantity
//   const newStock = product.currentStock + stockChange

//   // PREVENT NEGATIVE STOCK
//   if (newStock < 0) {
//     throw new Error(
//       `Cannot apply this adjustment. Current stock is ${product.currentStock} ${product.unit}. ` +
//       `This adjustment would result in negative stock (${newStock} ${product.unit}).`
//     )
//   }

//   await prisma.$transaction(async (tx) => {
//     await tx.stockMovement.create({
//       data: {
//         productId,
//         type,
//         quantity,
//         reason,
//       },
//     })

//     await tx.product.update({
//       where: { id: productId },
//       data: {
//         currentStock: {
//           increment: stockChange,
//         },
//       },
//     })
//   })

//   revalidatePath(`/products/${productId}`)
//   redirect(`/products/${productId}`)
// }



// export async function deleteProduct(formData: FormData) {
//   await requireRole("ADMIN") // Only admins can delete products
//   const productId = formData.get("productId") as string

//   // Check if product has any related records
//   const [orderItemCount, offerItemCount, movementCount] = await Promise.all([
//     prisma.orderItem.count({ where: { productId } }),
//     prisma.priceOfferItem.count({ where: { productId } }),
//     prisma.stockMovement.count({ where: { productId } }),
//   ])

//   if (orderItemCount > 0 || offerItemCount > 0 || movementCount > 0) {
//     throw new Error(
//       `Cannot delete this product. It has ${orderItemCount} order items, ${offerItemCount} offer items, and ${movementCount} stock movements. ` +
//       `Products with history cannot be deleted.`
//     )
//   }

//   await prisma.product.delete({ where: { id: productId } })
//   revalidatePath("/products")
// }
"use server"

import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createProduct(formData: FormData) {
  const session = await requireRole("ADMIN", "STAFF")
  const isStaff = session.user.role === "STAFF"

  const sku = formData.get("sku") as string
  const name = formData.get("name") as string
  const unit = formData.get("unit") as string || "pcs"
  const description = formData.get("description") as string
  const category = formData.get("category") as string
  const costPrice = isStaff ? 0 : parseFloat(formData.get("costPrice") as string) || 0
  const initialStock = parseInt(formData.get("initialStock") as string) || 0

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        sku,
        name,
        unit,
        description,
        category,
        costPrice,
        currentStock: initialStock,
      },
    })

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

  revalidatePath("/products")
  redirect("/products")
}

export async function adjustStock(prevState: { error: string | null }, formData: FormData) {
  await requireRole("ADMIN")
  const productId = formData.get("productId") as string
  const type = formData.get("type") as "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT"
  const quantity = parseInt(formData.get("quantity") as string)
  const reason = formData.get("reason") as string

  if (!productId || !quantity || quantity <= 0) {
    return { error: "Quantity must be greater than 0" }
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    return { error: "Product not found" }
  }

  const stockChange = type === "STOCK_IN" ? quantity : -quantity
  const newStock = product.currentStock + stockChange

  // VALIDATION: Prevent negative stock
  if (newStock < 0) {
    return { 
      error: `Cannot apply this adjustment. Current stock is ${product.currentStock} ${product.unit}. This adjustment would result in negative stock (${newStock} ${product.unit}).`
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({
      data: {
        productId,
        type,
        quantity,
        reason,
      },
    })

    await tx.product.update({
      where: { id: productId },
      data: {
        currentStock: {
          increment: stockChange,
        },
      },
    })
  })

  revalidatePath(`/products/${productId}`)
  redirect(`/products/${productId}`)
}

export async function deleteProduct(formData: FormData) {
  await requireRole("ADMIN")
  const productId = formData.get("productId") as string

  const [orderItemCount, offerItemCount, movementCount] = await Promise.all([
    prisma.orderItem.count({ where: { productId } }),
    prisma.priceOfferItem.count({ where: { productId } }),
    prisma.stockMovement.count({ where: { productId } }),
  ])

  if (orderItemCount > 0 || offerItemCount > 0 || movementCount > 0) {
    throw new Error(
      `Cannot delete this product. It has ${orderItemCount} order items, ${offerItemCount} offer items, and ${movementCount} stock movements.`
    )
  }

  await prisma.product.delete({ where: { id: productId } })
  revalidatePath("/products")
}
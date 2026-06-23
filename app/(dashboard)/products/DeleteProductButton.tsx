"use client"

import { deleteProduct } from "./actions"

export function DeleteProductButton({ productId }: { productId: string }) {
  return (
    <form 
      action={deleteProduct} 
      onSubmit={(e) => {
        if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <button type="submit" className="text-red-600 hover:text-red-900 font-medium">
        Delete
      </button>
    </form>
  )
}
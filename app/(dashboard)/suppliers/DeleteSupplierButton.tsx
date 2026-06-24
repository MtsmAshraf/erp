"use client"

import { deleteSupplier } from "./actions"

export function DeleteSupplierButton({ supplierId }: { supplierId: string }) {
  return (
    <form 
      action={deleteSupplier} 
      onSubmit={(e) => {
        if (!confirm("Are you sure you want to delete this supplier?")) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="supplierId" value={supplierId} />
      <button type="submit" className="text-red-600 hover:text-red-900 font-medium">
        Delete
      </button>
    </form>
  )
}
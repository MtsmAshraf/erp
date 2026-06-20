"use client"

import { deleteUser } from "./actions"

export function DeleteUserButton({ userId }: { userId: string }) {
  return (
    <form 
      action={deleteUser} 
      onSubmit={(e) => {
        if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <button type="submit" className="text-red-600 hover:text-red-900 font-medium">
        Delete
      </button>
    </form>
  )
}
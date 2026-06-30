import { prisma } from "@/app/lib/prisma"
import { requireRole } from "@/app/lib/auth-utils"
import Link from "next/link"
import { DeleteUserButton } from "./DeleteUserButton"
import { requirePermission } from "@/app/lib/auth-utils"

export default async function UsersPage() {
  await requirePermission("canViewUsers")
  await requireRole("ADMIN")
  
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Link
          href="/users/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add User
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{user.email}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{user.createdAt.toLocaleDateString()}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm space-x-3">
                  <Link 
                    href={`/users/${user.id}/permissions`} 
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    Permissions
                  </Link>
                  <DeleteUserButton userId={user.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import UserListActions from "@/components/admin/UserListActions"

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true, name: true, role: true, createdAt: true },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">Uživatelé</h1>
          <p className="text-[#8e8e93] text-sm mt-0.5">{users.length} uživatelů</p>
        </div>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nový uživatel
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="divide-y divide-[#e5e5ea]">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#f9f9f9] transition-colors">
              <div className="w-10 h-10 bg-[#007aff] rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {user.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#1d1d1f] text-sm">{user.name}</p>
                <p className="text-[#8e8e93] text-xs mt-0.5">@{user.username}</p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-[#f2f2f7] text-[#3c3c43] rounded-full font-medium">
                {user.role}
              </span>
              <UserListActions userId={user.id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

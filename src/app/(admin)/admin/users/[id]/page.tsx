import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import UserForm from "@/components/admin/UserForm"
import Link from "next/link"

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, name: true, role: true },
  })
  if (!user) notFound()

  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        <Link href="/admin/users" className="text-[#8e8e93] hover:text-[#1d1d1f] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">Upravit uživatele</h1>
          <p className="text-[#8e8e93] text-sm mt-0.5">@{user.username}</p>
        </div>
      </div>
      <UserForm initial={user} />
    </div>
  )
}

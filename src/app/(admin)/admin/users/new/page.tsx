import UserForm from "@/components/admin/UserForm"
import Link from "next/link"

export default function NewUserPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        <Link href="/admin/users" className="text-[#8e8e93] hover:text-[#1d1d1f] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Nový uživatel</h1>
      </div>
      <UserForm />
    </div>
  )
}

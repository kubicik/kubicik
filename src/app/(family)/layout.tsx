import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function FamilyLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/auth/signin?callbackUrl=/family")

  return (
    <div className="min-h-screen bg-[#f9f5f0]">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#e8e0d8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-[#ff9500] to-[#ff3b30] rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">R</span>
            </div>
            <span className="font-semibold text-[#1d1d1f] text-sm">Rodina</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link href="/family" className="px-3 py-1.5 text-sm text-[#3c3c43] hover:bg-[#f2f2f7] rounded-lg transition-colors">
              Rozvrh
            </Link>
            <Link href="/family/calendar" className="px-3 py-1.5 text-sm text-[#3c3c43] hover:bg-[#f2f2f7] rounded-lg transition-colors">
              Prázdniny
            </Link>
            <Link href="/family/settings" className="px-3 py-1.5 text-sm text-[#3c3c43] hover:bg-[#f2f2f7] rounded-lg transition-colors">
              Nastavení
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  )
}

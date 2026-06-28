import Link from "next/link"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#e5e5ea]/60">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 bg-[#007aff] rounded-lg flex items-center justify-center shadow-sm select-none">
              <span className="text-white font-extrabold text-sm leading-none tracking-tight">K</span>
            </div>
            <span className="font-semibold text-[#1d1d1f] text-sm">Kubičík Gang</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="/participants"
              className="text-[#8e8e93] hover:text-[#1d1d1f] text-sm transition-colors"
            >
              Účastníci
            </Link>
            <Link
              href="/kartickar"
              className="text-[#8e8e93] hover:text-[#1d1d1f] text-sm transition-colors"
            >
              Kartičky
            </Link>
            <Link
              href="/spurs"
              className="flex items-center gap-1.5 text-[#8e8e93] hover:text-[#132257] text-sm transition-colors"
            >
              <span className="w-4 h-4 rounded bg-[#132257] inline-flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              Spurs
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e5e5ea] py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-[#8e8e93] text-sm">
          <span>© {new Date().getFullYear()} Kubičík Gang</span>
          <Link href="/admin" className="hover:text-[#1d1d1f] transition-colors">
            Admin
          </Link>
        </div>
      </footer>
    </div>
  )
}

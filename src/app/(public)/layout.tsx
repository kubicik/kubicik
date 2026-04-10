import Link from "next/link"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#e5e5ea]/60">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 bg-[#007aff] rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064" />
              </svg>
            </div>
            <span className="font-semibold text-[#1d1d1f] text-sm">Kubicik Travel</span>
          </Link>
          <Link
            href="/admin"
            className="text-[#8e8e93] hover:text-[#1d1d1f] text-sm transition-colors"
          >
            Admin
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e5e5ea] py-6">
        <div className="max-w-5xl mx-auto px-6 text-center text-[#8e8e93] text-sm">
          © {new Date().getFullYear()} Kubicik Travel
        </div>
      </footer>
    </div>
  )
}

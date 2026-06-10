"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"

interface Props {
  user?: { name?: string | null; email?: string | null }
}

interface NavGroup {
  label: string
  href?: string
  icon: React.ReactNode
  children?: { label: string; href: string }[]
}

const navGroups: NavGroup[] = [
  {
    label: "Přehled",
    href: "/admin",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Výlety",
    href: "/admin/trips",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
      </svg>
    ),
  },
  {
    label: "Spurs",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    ),
    children: [
      { label: "Zápasy", href: "/admin/matches" },
      { label: "Sezóny", href: "/admin/seasons" },
    ],
  },
  {
    label: "Kartičky",
    href: "/admin/kartickar",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    label: "Uživatelé",
    href: "/admin/users",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
]

export default function AdminSidebar({ user }: Props) {
  const pathname = usePathname()

  function isUnderPath(prefix: string) {
    if (prefix === "/admin") return pathname === "/admin"
    return pathname.startsWith(prefix)
  }

  // Auto-expand groups that contain the current route
  const initialOpen = (group: NavGroup) =>
    group.children?.some((c) => pathname.startsWith(c.href)) ?? false

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    for (const g of navGroups) {
      if (g.children) map[g.label] = initialOpen(g)
    }
    return map
  })

  // Keep expanded when navigating within a group
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev }
      for (const g of navGroups) {
        if (g.children && initialOpen(g)) next[g.label] = true
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <aside className="w-60 bg-white border-r border-[#e5e5ea] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#e5e5ea]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-[#007aff] rounded-lg flex items-center justify-center shadow-sm group-hover:bg-[#0066d6] transition-colors">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064" />
            </svg>
          </div>
          <span className="font-semibold text-[#1d1d1f] text-sm">Kubicik Travel</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navGroups.map((group) => {
          if (group.children) {
            const isOpen = openGroups[group.label] ?? false
            const anyChildActive = group.children.some((c) => pathname.startsWith(c.href))
            return (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    anyChildActive && !isOpen
                      ? "bg-[#f0f6ff] text-[#007aff]"
                      : "text-[#3c3c43] hover:bg-[#f2f2f7]"
                  }`}
                >
                  {group.icon}
                  <span className="flex-1 text-left">{group.label}</span>
                  <svg
                    className={`w-4 h-4 text-[#8e8e93] transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="mt-0.5 ml-4 pl-4 border-l border-[#e5e5ea] space-y-0.5">
                    {group.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center px-3 py-2 rounded-xl text-sm transition-colors ${
                          isUnderPath(child.href)
                            ? "bg-[#007aff] text-white"
                            : "text-[#3c3c43] hover:bg-[#f2f2f7]"
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={group.href}
              href={group.href!}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isUnderPath(group.href!)
                  ? "bg-[#007aff] text-white"
                  : "text-[#3c3c43] hover:bg-[#f2f2f7]"
              }`}
            >
              {group.icon}
              {group.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-[#e5e5ea]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1">
          <div className="w-8 h-8 bg-[#e5e5ea] rounded-full flex items-center justify-center text-sm font-medium text-[#3c3c43]">
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1d1d1f] truncate">{user?.name}</p>
            <p className="text-xs text-[#8e8e93] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#ff3b30] hover:bg-[#fff2f0] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Odhlásit se
        </button>
      </div>
    </aside>
  )
}

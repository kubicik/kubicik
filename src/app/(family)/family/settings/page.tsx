import { prisma } from "@/lib/prisma"
import ChildrenSettings from "@/components/family/ChildrenSettings"
import type { FamilyChild } from "@/types"

export const revalidate = 0

export default async function FamilySettingsPage() {
  const childrenRaw = await prisma.familyChild.findMany({ orderBy: { order: "asc" } })
  const children: FamilyChild[] = childrenRaw.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    order: c.order,
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Nastavení</h1>
        <p className="text-[#8e8e93] text-sm mt-0.5">Správa dětí a přístupu</p>
      </div>
      <ChildrenSettings initialChildren={children} />
    </div>
  )
}

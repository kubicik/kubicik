import { prisma } from "@/lib/prisma"
import FamilyCalendar from "@/components/family/FamilyCalendar"
import type { FamilyChild, FamilyEvent } from "@/types"

export const revalidate = 0

export default async function FamilyCalendarPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [childrenRaw, eventsRaw] = await Promise.all([
    prisma.familyChild.findMany({ orderBy: { order: "asc" } }),
    prisma.familyEvent.findMany({
      where: {
        AND: [
          { startDate: { lte: new Date(year, month, 0, 23, 59, 59) } },
          { endDate: { gte: new Date(year, month - 1, 1) } },
        ],
      },
      orderBy: { startDate: "asc" },
    }),
  ])

  const children: FamilyChild[] = childrenRaw.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    order: c.order,
  }))

  const events: FamilyEvent[] = eventsRaw.map((e) => ({
    id: e.id,
    childId: e.childId,
    title: e.title,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    color: e.color,
    note: e.note,
    createdAt: e.createdAt.toISOString(),
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Prázdninový kalendář</h1>
        <p className="text-[#8e8e93] text-sm mt-0.5">Kde jsou děti a co se chystá</p>
      </div>
      <FamilyCalendar
        initialEvents={events}
        initialChildren={children}
        initialYear={year}
        initialMonth={month}
      />
    </div>
  )
}

import { prisma } from "@/lib/prisma"
import WeeklySchedule from "@/components/family/WeeklySchedule"
import type { FamilyChild, Activity } from "@/types"

export const revalidate = 0

export default async function FamilyPage() {
  const [childrenRaw, activitiesRaw] = await Promise.all([
    prisma.familyChild.findMany({ orderBy: { order: "asc" } }),
    prisma.activity.findMany({
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
  ])

  const children: FamilyChild[] = childrenRaw.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    order: c.order,
  }))

  const activities: Activity[] = activitiesRaw.map((a) => ({
    id: a.id,
    childId: a.childId,
    name: a.name,
    dayOfWeek: a.dayOfWeek,
    startTime: a.startTime,
    endTime: a.endTime,
    location: a.location,
    color: a.color,
    createdAt: a.createdAt.toISOString(),
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Týdenní rozvrh</h1>
        <p className="text-[#8e8e93] text-sm mt-0.5">Kroužky a aktivity dětí</p>
      </div>
      <WeeklySchedule initialActivities={activities} initialChildren={children} />
    </div>
  )
}

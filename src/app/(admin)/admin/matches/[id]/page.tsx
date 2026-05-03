import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import MatchForm from "@/components/admin/MatchForm"

export default async function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const match = await prisma.match.findUnique({ where: { id } })
  if (!match) notFound()

  const serialized = {
    ...match,
    date: match.date.toISOString(),
    createdAt: match.createdAt.toISOString(),
    updatedAt: match.updatedAt.toISOString(),
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-8">Upravit zápas</h1>
      <MatchForm match={serialized} />
    </div>
  )
}

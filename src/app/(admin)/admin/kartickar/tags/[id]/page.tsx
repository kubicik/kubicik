import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import CardTagForm from "@/components/admin/CardTagForm"

export default async function EditCardTagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tag = await prisma.cardTag.findUnique({ where: { id } })
  if (!tag) notFound()

  const initial = {
    ...tag,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/kartickar/tags" className="text-sm text-[#007aff] hover:underline flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Štítky
        </Link>
        <span className="text-[#c7c7cc]">/</span>
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Upravit štítek</h1>
      </div>
      <CardTagForm initial={initial} />
    </div>
  )
}

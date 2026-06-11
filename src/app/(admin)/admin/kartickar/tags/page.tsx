import { prisma } from "@/lib/prisma"
import Link from "next/link"
import CardTagDeleteButton from "@/components/admin/CardTagDeleteButton"

export default async function CardTagsPage() {
  const tags = await prisma.cardTag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { series: true } } },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">Štítky kartiček</h1>
          <p className="text-[#8e8e93] text-sm mt-0.5">{tags.length} štítků</p>
        </div>
        <Link
          href="/admin/kartickar/tags/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#007aff] text-white text-sm font-medium rounded-xl hover:bg-[#0066d6] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nový štítek
        </Link>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-20 text-[#8e8e93] bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
          Zatím žádné štítky.
        </div>
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white flex-shrink-0"
                style={{ backgroundColor: tag.color }}
              >
                {tag.symbol} {tag.name}
              </span>
              <span className="text-xs text-[#8e8e93] flex-1">
                {tag._count.series === 0 ? "Nepoužito" : `${tag._count.series} ${tag._count.series === 1 ? "série" : "sérii"}`}
              </span>
              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/kartickar/tags/${tag.id}`}
                  className="p-2 text-[#8e8e93] hover:text-[#007aff] hover:bg-[#f0f6ff] rounded-xl transition-colors"
                  title="Upravit"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
                <CardTagDeleteButton id={tag.id} name={tag.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

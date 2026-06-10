import Link from "next/link"
import CardSeriesForm from "@/components/admin/CardSeriesForm"

export default function NewCardSeriesPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        <Link href="/admin/kartickar" className="text-[#8e8e93] hover:text-[#1d1d1f] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Nová série kartiček</h1>
      </div>
      <CardSeriesForm />
    </div>
  )
}

import TripForm from "@/components/admin/TripForm"
import Link from "next/link"

export default function NewTripPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-8">
        <Link href="/admin/trips" className="text-[#8e8e93] hover:text-[#1d1d1f] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Nový výlet</h1>
      </div>
      <TripForm />
    </div>
  )
}

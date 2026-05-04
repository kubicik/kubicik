"use client"

import { useRouter } from "next/navigation"
import type { Season } from "@/types"

interface Props {
  seasons: Season[]
  selected: string | null
}

export default function SeasonFilter({ seasons, selected }: Props) {
  const router = useRouter()

  function handleChange(value: string) {
    const url = value ? `/admin/matches?season=${value}` : "/admin/matches"
    router.push(url)
  }

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <button
        onClick={() => handleChange("")}
        className={`px-3 py-1.5 text-sm rounded-xl border transition-colors ${
          !selected ? "bg-[#1d1d1f] text-white border-[#1d1d1f]" : "bg-white text-[#3a3a3c] border-[#e5e5ea] hover:bg-[#f2f2f7]"
        }`}
      >
        Všechny sezóny
      </button>
      {seasons.map((s) => (
        <button
          key={s.id}
          onClick={() => handleChange(s.id)}
          className={`px-3 py-1.5 text-sm rounded-xl border transition-colors ${
            selected === s.id ? "bg-[#132257] text-white border-[#132257]" : "bg-white text-[#3a3a3c] border-[#e5e5ea] hover:bg-[#f2f2f7]"
          }`}
        >
          {s.name}
        </button>
      ))}
    </div>
  )
}

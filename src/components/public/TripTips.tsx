interface TipsData {
  logistika?: string[]
  pozor?: string[]
}

interface Props {
  tips: string
  tripType?: string | null
}

export default function TripTips({ tips, tripType }: Props) {
  let data: TipsData = {}
  try {
    data = JSON.parse(tips) as TipsData
  } catch {
    return null
  }

  if (!data.logistika?.length && !data.pozor?.length) return null

  return (
    <section className="py-16">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-[#1d1d1f] mb-2">Praktické tipy</h2>
        <p className="text-[#6e6e73] text-base mb-10">
          Co jsme zjistili — pro vás, až pojedete příště.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {data.logistika && data.logistika.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#1d1d1f] uppercase tracking-widest mb-4">
                Logistika
              </h3>
              <ul className="space-y-3">
                {data.logistika.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[#3a3a3c] leading-relaxed">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full border border-[#d1d1d6] flex items-center justify-center text-xs text-[#8e8e93] mt-0.5">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.pozor && data.pozor.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[#1d1d1f] uppercase tracking-widest mb-4">
                Na co si dát pozor
              </h3>
              <ul className="space-y-3">
                {data.pozor.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[#3a3a3c] leading-relaxed">
                    <span className="flex-shrink-0 w-1 h-1 rounded-full bg-[#8e8e93] mt-2.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

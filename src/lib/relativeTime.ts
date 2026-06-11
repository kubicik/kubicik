export function relativeTime(date: Date, now = new Date()): string {
  const diff = now.getTime() - date.getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)

  if (mins  <  1) return "Právě teď"
  if (mins  < 60) return `před ${mins} min`
  if (hours < 24) return `před ${hours} h`
  if (days  ===1) return "Včera"
  if (days  <  7) return `před ${days} dny`
  return date.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" })
}

export function seriesLastChanged(
  seriesUpdatedAt: Date,
  variantUpdatedAts: Date[]
): Date {
  return new Date(Math.max(seriesUpdatedAt.getTime(), ...variantUpdatedAts.map((d) => d.getTime())))
}

export function cardSortKey(number: string): [number, string] {
  const m = number.match(/^(\d+)/)
  return m ? [parseInt(m[1], 10), number] : [Infinity, number]
}

export function sortCards<T extends { order: number; number: string }>(cards: T[]): T[] {
  return [...cards].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    const [an, as] = cardSortKey(a.number)
    const [bn, bs] = cardSortKey(b.number)
    return an !== bn ? an - bn : as.localeCompare(bs)
  })
}

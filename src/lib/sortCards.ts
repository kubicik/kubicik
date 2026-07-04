export function sortCards<T extends { order: number; number: string }>(cards: T[]): T[] {
  return [...cards].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    return a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: "base" })
  })
}

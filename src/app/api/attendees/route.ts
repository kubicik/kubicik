import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Autocomplete suggestions for the unified person registry (číselník).
// Backed by the authoritative Person table.
export async function GET() {
  const persons = await prisma.person.findMany({ select: { name: true } })
  return NextResponse.json(persons.map((p) => p.name).sort((a, b) => a.localeCompare(b, "cs")))
}

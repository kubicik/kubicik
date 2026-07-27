import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { mergePersons } from "@/lib/persons"

// Merge one or more source persons into a target person.
// Body: { sourceIds: string[], targetId: string }
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { sourceIds, targetId } = await req.json()
  if (!targetId || !Array.isArray(sourceIds) || sourceIds.length === 0) {
    return NextResponse.json({ error: "Chybí zdrojové osoby nebo cíl" }, { status: 400 })
  }

  try {
    await mergePersons(sourceIds, targetId)
  } catch (e) {
    if (e instanceof Error && e.message === "PERSON_NOT_FOUND") {
      return NextResponse.json({ error: "Cílová osoba nenalezena" }, { status: 404 })
    }
    throw e
  }
  return NextResponse.json({ ok: true })
}

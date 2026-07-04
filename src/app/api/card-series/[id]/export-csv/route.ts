import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sortCards } from "@/lib/sortCards"

function csvEscape(v: string | null | undefined): string {
  const s = v ?? ""
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`
  return s
}

function sanitizeFilename(s: string) {
  return s.replace(/[^a-zA-Z0-9áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ ]/g, "_")
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const subsetId = new URL(req.url).searchParams.get("subsetId") || undefined

  const series = await prisma.cardSeries.findUnique({
    where: { id },
    include: {
      subsets: {
        where: { isHidden: false, ...(subsetId ? { id: subsetId } : {}) },
        orderBy: { order: "asc" },
        include: {
          parallels: { where: { isCollected: true }, orderBy: { order: "asc" } },
          cards: {
            include: {
              variants: { include: { parallel: true } },
            },
          },
        },
      },
    },
  })
  if (!series) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const rows: string[] = []
  rows.push("﻿Subset,Číslo,Jméno,Klub,Paralela,Limit,Vlastní")

  for (const subset of series.subsets) {
    const parallels = subset.parallels
    const cards = sortCards(subset.cards)
    for (const card of cards) {
      const variantMap = new Map(card.variants.map((v) => [v.parallelId, v]))
      if (parallels.length === 0) {
        rows.push([csvEscape(subset.name), csvEscape(card.number), csvEscape(card.name), csvEscape(card.club), "", "", ""].join(","))
      } else {
        for (const p of parallels) {
          const variant = variantMap.get(p.id)
          const owned = variant?.isOwned ? "ANO" : "NE"
          const limit = p.limitNumber != null ? String(p.limitNumber) : ""
          rows.push([
            csvEscape(subset.name),
            csvEscape(card.number),
            csvEscape(card.name),
            csvEscape(card.club),
            csvEscape(p.name),
            limit,
            owned,
          ].join(","))
        }
      }
    }
  }

  const subsetSuffix = subsetId && series.subsets.length === 1 ? `-${sanitizeFilename(series.subsets[0].name)}` : ""
  const filename = `${sanitizeFilename(series.name)}${subsetSuffix}-sbírka.csv`

  return new NextResponse(rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}

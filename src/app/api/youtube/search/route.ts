import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const q = request.nextUrl.searchParams.get("q")?.trim()
  if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 })

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return NextResponse.json({ error: "NO_API_KEY" }, { status: 503 })

  const url = new URL("https://www.googleapis.com/youtube/v3/search")
  url.searchParams.set("part", "snippet")
  url.searchParams.set("type", "video")
  url.searchParams.set("q", q)
  url.searchParams.set("key", apiKey)
  url.searchParams.set("maxResults", "8")
  url.searchParams.set("relevanceLanguage", "en")

  const res = await fetch(url.toString())
  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json(
      { error: data.error?.message ?? "YouTube API error" },
      { status: res.status }
    )
  }

  const videos = (data.items ?? []).map((item: {
    id: { videoId: string }
    snippet: {
      title: string
      channelTitle: string
      publishedAt: string
      thumbnails: { medium?: { url: string }; default?: { url: string } }
    }
  }) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? "",
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
  }))

  return NextResponse.json({ videos })
}

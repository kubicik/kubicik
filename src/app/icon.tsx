import { ImageResponse } from "next/og"

export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          background: "#007aff",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: -1,
          paddingBottom: 2,
        }}
      >
        K
      </div>
    ),
    { width: 64, height: 64 }
  )
}

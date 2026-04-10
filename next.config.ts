import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/uploads/**",
      },
    ],
  },
  serverExternalPackages: ["better-sqlite3"],
}

export default nextConfig

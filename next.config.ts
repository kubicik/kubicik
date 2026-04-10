import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/uploads/**",
      },
    ],
  },
  serverExternalPackages: ["@libsql/client"],
}

export default nextConfig

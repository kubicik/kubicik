import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/uploads/**",
      },
    ],
  },
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql", "@prisma/client"],
}

export default nextConfig

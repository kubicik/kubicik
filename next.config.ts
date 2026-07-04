import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_GIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  },
  images: {
    localPatterns: [
      { pathname: "/uploads/**" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql", "@prisma/client", "sharp"],
}

export default nextConfig

import type { NextAuthConfig } from "next-auth"

// Lightweight config for Edge Runtime (middleware/proxy)
// Does NOT import any Node.js APIs
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAdminRoute = nextUrl.pathname.startsWith("/admin")
      const isApiProtected =
        nextUrl.pathname.startsWith("/api/trips") ||
        nextUrl.pathname.startsWith("/api/users") ||
        nextUrl.pathname.startsWith("/api/upload")

      if (isAdminRoute || isApiProtected) {
        if (isLoggedIn) return true
        if (isApiProtected) return Response.json({ error: "Unauthorized" }, { status: 401 })
        return false // redirect to signin
      }
      return true
    },
  },
  providers: [], // filled in auth.ts
}

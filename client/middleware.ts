// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { attemptTokenRefresh } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value;

  if (!accessToken) {
    const refreshed = await attemptTokenRefresh();
    console.log("Token refreshed:", refreshed);

    if (!refreshed) {
      return NextResponse.redirect(new URL("/login", req.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/"], // Protect these routes
};

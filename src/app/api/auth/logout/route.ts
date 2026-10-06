import { NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set(sessionCookieOptions.name, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}

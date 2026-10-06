import { connectDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[health] DB connection failed:", err);
    return Response.json({ ok: false }, { status: 500 });
  }
}

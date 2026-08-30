import { NextResponse } from "next/server";
import { getBoard } from "@/lib/monday/boards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight config/connectivity check — handy after deploying, to
 * confirm env vars are set and both boards are reachable without going
 * through the chat UI. Never returns board data, only counts.
 */
export async function GET() {
  const checks: Record<string, string> = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "set" : "MISSING",
    MONDAY_API_TOKEN: process.env.MONDAY_API_TOKEN ? "set" : "MISSING",
  };

  const boards: Record<string, string> = {};

  for (const kind of ["deals", "workOrders"] as const) {
    try {
      const board = await getBoard(kind);
      boards[kind] = `ok — "${board.name}" (${board.items_page.items.length} items)`;
    } catch (err) {
      boards[kind] = `error — ${err instanceof Error ? err.message : "unknown"}`;
    }
  }

  const healthy =
    Object.values(checks).every((v) => v === "set") &&
    Object.values(boards).every((v) => v.startsWith("ok"));

  return NextResponse.json({ healthy, env: checks, boards }, { status: healthy ? 200 : 503 });
}

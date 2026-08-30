import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/ai/agent";
import type { ChatRequestBody } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // never cache — data must be live

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "`messages` must be a non-empty array." }, { status: 400 });
  }

  try {
    const reply = await runAgent(messages);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[/api/chat] agent error:", err);
    const message =
      err instanceof Error ? err.message : "Unexpected error while running the agent.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

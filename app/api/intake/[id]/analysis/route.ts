import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Automation seam (future). An n8n flow calls the Claude API to analyze a
// submission (dedup guess, suggested category, confidence, draft fields) and
// POSTs the result here. We store it on the row; a human still does the final
// approve in the admin Intake tab. Inert until INTAKE_ANALYSIS_TOKEN is set.
//
// Auth: a shared bearer token (set the same value in n8n). Not the admin
// session — this is a server-to-server call with no browser involved.
//
// Body: { autoAnalysis: object, autoStatus?: "pending" | "drafted" | "needs_human" }

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const expected = process.env.INTAKE_ANALYSIS_TOKEN;
  if (!expected) {
    return NextResponse.json({ ok: false, error: "Analysis endpoint not enabled." }, { status: 503 });
  }
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (provided !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await ctx.params;

  let body: { autoAnalysis?: unknown; autoStatus?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  if (typeof body.autoAnalysis !== "object" || body.autoAnalysis === null) {
    return NextResponse.json(
      { ok: false, error: "autoAnalysis (object) is required." },
      { status: 422 },
    );
  }
  const autoStatus =
    typeof body.autoStatus === "string" ? body.autoStatus.slice(0, 40) : "drafted";

  try {
    await prisma.submission.update({
      where: { id },
      data: {
        autoAnalysis: body.autoAnalysis as object,
        autoStatus,
      },
      select: { id: true },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Submission not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

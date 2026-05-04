import { NextResponse } from "next/server";
import {
  buildResumeAiErrorMessage,
  parseOptimizeRequest,
  runResumeOptimization
} from "@/lib/resume-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = parseOptimizeRequest(body);
    const result = await runResumeOptimization(input);

    return NextResponse.json({
      ok: true,
      result
    });
  } catch (error) {
    return NextResponse.json(
      { detail: buildResumeAiErrorMessage(error, "简历优化请求失败。") },
      { status: 500 }
    );
  }
}

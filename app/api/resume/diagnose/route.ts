import { NextResponse } from "next/server";
import {
  buildResumeAiErrorMessage,
  parseDiagnoseRequest,
  runResumeDiagnosis
} from "@/lib/resume-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = parseDiagnoseRequest(body);
    const result = await runResumeDiagnosis(input);

    return NextResponse.json({
      ok: true,
      result
    });
  } catch (error) {
    return NextResponse.json(
      { detail: buildResumeAiErrorMessage(error, "AI 简历诊断请求失败。") },
      { status: 500 }
    );
  }
}

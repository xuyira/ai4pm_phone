import { after, NextResponse } from "next/server";
import { buildResumeAiErrorMessage } from "@/lib/resume-ai";
import { createDiagnosisTask, runTask } from "@/lib/resume-task-store";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const task = await createDiagnosisTask(body);

    after(async () => {
      await runTask(task.id);
    });

    return NextResponse.json({
      ok: true,
      taskId: task.id,
      stage: task.stage,
      status: task.status
    });
  } catch (error) {
    return NextResponse.json(
      { detail: buildResumeAiErrorMessage(error, "AI 简历诊断任务创建失败。") },
      { status: 500 }
    );
  }
}

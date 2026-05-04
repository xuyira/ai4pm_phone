import { NextResponse } from "next/server";
import { getResumeTask } from "@/lib/resume-task-store";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(
  _request: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await context.params;
  const task = await getResumeTask(taskId);

  if (!task) {
    return NextResponse.json({ detail: "任务不存在或已失效。" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    taskId: task.id,
    stage: task.stage,
    status: task.status,
    error: task.error,
    result: task.result,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  });
}

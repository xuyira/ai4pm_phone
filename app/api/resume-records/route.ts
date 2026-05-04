import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const maxDuration = 30;

const SHARED_RESUME_RECORDS_KEY = "ai4pm:shared-resume-records";

function buildKvErrorMessage() {
  return "共享记录存储未配置完成，请先在 Vercel 项目中绑定 Redis/KV 环境变量。";
}

export async function GET() {
  try {
    const records = await kv.get<unknown[]>(SHARED_RESUME_RECORDS_KEY);
    return NextResponse.json({
      ok: true,
      records: Array.isArray(records) ? records : []
    });
  } catch (error) {
    return NextResponse.json(
      {
        detail: error instanceof Error ? buildKvErrorMessage() : "读取共享记录失败。"
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { records?: unknown };

    if (!Array.isArray(body.records)) {
      return NextResponse.json({ detail: "缺少合法的记录列表。" }, { status: 400 });
    }

    await kv.set(SHARED_RESUME_RECORDS_KEY, body.records);

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    return NextResponse.json(
      {
        detail: error instanceof Error ? buildKvErrorMessage() : "保存共享记录失败。"
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { buildResumeDocxBuffer } from "@/lib/resume-docx";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      filename?: string;
      doc?: {
        candidateName: string;
        headline: string;
        contactLines: string[];
        summary: string[];
        experience: { title: string; subtitle?: string; bullets: string[] }[];
        projects: { title: string; subtitle?: string; bullets: string[] }[];
        education: { title: string; subtitle?: string; bullets: string[] }[];
        skills: string[];
        additionalSections: { title: string; subtitle?: string; bullets: string[] }[];
      };
    };

    if (!body.doc) {
      return NextResponse.json({ detail: "缺少可导出的简历内容。" }, { status: 400 });
    }

    const buffer = await buildResumeDocxBuffer(body.doc);
    const safeName = (body.filename || `${body.doc.candidateName || "optimized-resume"}.docx`)
      .replace(/[\\/:*?"<>|]+/g, "-")
      .trim();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(safeName)}"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        detail: error instanceof Error ? error.message : "DOCX 导出失败。"
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIClient } from "@/lib/ai/openai";
import { buildResumeDiagnosisInstructions, buildResumeDiagnosisPrompt } from "@/lib/ai/prompts";
import { resumeDiagnosisSchema } from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

type DiagnoseRequest = {
  jobTitle: string;
  jobType: "intern" | "fulltime";
  jobDescription: string;
  notes: string;
  resumeText: string;
  projectMaterialsText?: string;
};

function buildErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message;

    if (
      /incorrect api key/i.test(message) ||
      /invalid api key/i.test(message) ||
      /authentication/i.test(message) ||
      /401/.test(message)
    ) {
      return "AI 服务鉴权失败，请检查 Vercel 中配置的 OPENAI_API_KEY 是否正确并重新部署。";
    }

    if (/rate limit/i.test(message) || /429/.test(message)) {
      return "AI 服务当前请求较多，请稍后重试。";
    }

    return error.message;
  }

  return "AI 简历诊断请求失败。";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<DiagnoseRequest>;
    const jobTitle = body.jobTitle?.trim() ?? "";
    const jobType = body.jobType ?? "intern";
    const jobDescription = body.jobDescription?.trim() ?? "";
    const notes = body.notes?.trim() ?? "";
    const resumeText = body.resumeText?.trim() ?? "";
    const projectMaterialsText = body.projectMaterialsText?.trim() ?? "";

    if (!resumeText) {
      return NextResponse.json({ detail: "缺少简历文本。" }, { status: 400 });
    }

    if (!jobDescription) {
      return NextResponse.json({ detail: "缺少目标岗位 JD。" }, { status: 400 });
    }

    const client = getOpenAIClient();
    const diagnosisResponse = await client.responses.parse({
      model: "gpt-5.4-nano",
      instructions: buildResumeDiagnosisInstructions(),
      input: buildResumeDiagnosisPrompt({
        jobTitle,
        jobType,
        jobDescription,
        originalResume: resumeText,
        notes,
        projectMaterials: projectMaterialsText
      }),
      text: {
        format: zodTextFormat(resumeDiagnosisSchema, "resume_diagnosis")
      }
    });

    const diagnosis = diagnosisResponse.output_parsed;
    if (!diagnosis) {
      throw new Error("简历诊断失败。");
    }

    return NextResponse.json({
      ok: true,
      result: {
        ...diagnosis,
        rawModelOutput: diagnosisResponse.output_text || JSON.stringify(diagnosis, null, 2)
      }
    });
  } catch (error) {
    return NextResponse.json({ detail: buildErrorMessage(error) }, { status: 500 });
  }
}

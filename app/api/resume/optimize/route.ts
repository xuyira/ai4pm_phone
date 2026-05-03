import { NextResponse } from "next/server";
import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIClient } from "@/lib/ai/openai";
import {
  buildResumeOptimizationInstructions,
  buildResumeOptimizationPrompt
} from "@/lib/ai/prompts";
import {
  jdResumeEvidenceItemSchema,
  jobProfileSchema,
  resumeDiagnosisSchema,
  resumeOptimizationOutputSchema
} from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

type OptimizeRequest = {
  jobProfile: unknown;
  jdResumeEvidenceMatrix: unknown;
  originalJobDescription: string;
  originalResumeText: string;
  diagnosisScores: unknown;
  diagnosisActions?: Array<{
    dimension: string;
    userComment: string;
  }>;
  quickSupplementQuestions?: Array<{
    id: string;
    question: string;
    whyAsk: string;
    sourceDimensions: string[];
  }>;
  quickSupplementAnswers?: Record<string, string>;
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

  return "简历优化请求失败。";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<OptimizeRequest>;
    const jobProfile = body.jobProfile ? jobProfileSchema.parse(body.jobProfile) : null;
    const jdResumeEvidenceMatrix = Array.isArray(body.jdResumeEvidenceMatrix)
      ? body.jdResumeEvidenceMatrix.map((item) => jdResumeEvidenceItemSchema.parse(item))
      : null;
    const originalJobDescription = body.originalJobDescription?.trim() ?? "";
    const originalResumeText = body.originalResumeText?.trim() ?? "";
    const diagnosisScores = body.diagnosisScores
      ? resumeDiagnosisSchema.shape.diagnosisScores.parse(body.diagnosisScores)
      : null;
    const diagnosisActions = Array.isArray(body.diagnosisActions)
      ? body.diagnosisActions.map((item) => ({
          dimension: typeof item.dimension === "string" ? item.dimension : "",
          userComment: typeof item.userComment === "string" ? item.userComment : ""
        }))
      : [];
    const quickSupplementQuestions = body.quickSupplementQuestions
      ? resumeDiagnosisSchema.shape.quickSupplementQuestions.parse(body.quickSupplementQuestions)
      : [];
    const quickSupplementAnswers = body.quickSupplementAnswers ?? {};

    if (!jobProfile || !jdResumeEvidenceMatrix || !diagnosisScores || !originalResumeText) {
      return NextResponse.json({ detail: "缺少第二阶段简历优化所需信息。" }, { status: 400 });
    }

    const client = getOpenAIClient();

    const optimizationResponse = await client.responses.parse({
      model: "gpt-5.4-nano",
      instructions: buildResumeOptimizationInstructions(),
      input: buildResumeOptimizationPrompt({
        jobProfile,
        jdResumeEvidenceMatrix,
        originalJobDescription,
        originalResumeText,
        diagnosisScores,
        diagnosisActions,
        quickSupplementQuestions,
        quickSupplementAnswers
      }),
      text: {
        format: zodTextFormat(resumeOptimizationOutputSchema, "resume_optimization_output")
      }
    });

    const optimizationOutput = optimizationResponse.output_parsed;
    if (!optimizationOutput) {
      throw new Error("优化结果生成失败。");
    }

    return NextResponse.json({
      ok: true,
      result: {
        jobProfile,
        jdResumeEvidenceMatrix,
        optimizedResumeProfile: optimizationOutput.optimizedResumeProfile,
        optimizedResumeText: JSON.stringify(optimizationOutput.optimizedResumeProfile, null, 2),
        beforeScores: diagnosisScores,
        afterScores: optimizationOutput.optimizedDiagnosisScores,
        finalSummary: optimizationOutput.finalSummary,
        rawModelOutput:
          optimizationResponse.output_text || JSON.stringify(optimizationOutput, null, 2)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { detail: buildErrorMessage(error) },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIClient } from "@/lib/ai/openai";
import {
  buildResumeOptimizationInstructions,
  buildResumeOptimizationPrompt
} from "@/lib/ai/prompts";
import {
  jobProfileSchema,
  resumeDiagnosisSchema,
  resumeOptimizationOutputSchema,
  resumeProfileSchema
} from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

type OptimizeRequest = {
  jobProfile: unknown;
  resumeProfile: unknown;
  diagnosisScores: unknown;
  diagnosisActions: Array<{
    dimension: string;
    suggestion: string;
    adopted: boolean;
    userComment: string;
  }>;
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
    const resumeProfile = body.resumeProfile ? resumeProfileSchema.parse(body.resumeProfile) : null;
    const diagnosisScores = body.diagnosisScores
      ? resumeDiagnosisSchema.shape.diagnosisScores.parse(body.diagnosisScores)
      : null;
    const diagnosisActions = body.diagnosisActions ?? [];

    if (!jobProfile || !resumeProfile || !diagnosisScores) {
      return NextResponse.json({ detail: "缺少第二节点的结构化诊断结果。" }, { status: 400 });
    }

    const client = getOpenAIClient();

    const optimizationResponse = await client.responses.parse({
      model: "gpt-5.4-nano",
      instructions: buildResumeOptimizationInstructions(),
      input: buildResumeOptimizationPrompt({
        jobProfile,
        resumeProfile,
        diagnosisScores,
        diagnosisActions
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
        optimizedResumeProfile: optimizationOutput.optimizedResumeProfile,
        optimizedResumeText: JSON.stringify(optimizationOutput.optimizedResumeProfile, null, 2),
        beforeScores: diagnosisScores,
        afterScores: optimizationOutput.optimizedDiagnosisScores,
        unsupportedActions: optimizationOutput.unsupportedActions,
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

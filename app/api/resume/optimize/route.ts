import { NextResponse } from "next/server";
import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIClient } from "@/lib/ai/openai";
import {
  buildBaselineReviewInstructions,
  buildBaselineReviewPrompt,
  buildResumeOptimizationInstructions,
  buildResumeOptimizationPrompt
} from "@/lib/ai/prompts";
import {
  resumeBaselineReviewSchema,
  resumeOptimizationOutputSchema
} from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

type OptimizeRequest = {
  jobTitle: string;
  jobType: "intern" | "fulltime";
  jobDescription: string;
  notes: string;
  revisionNotes?: string;
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

  return "简历优化请求失败。";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<OptimizeRequest>;
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

    const baselineResponse = await client.responses.parse({
      model: "gpt-4.1-nano",
      instructions: buildBaselineReviewInstructions(),
      input: buildBaselineReviewPrompt({
        jobTitle,
        jobType,
        jobDescription,
        originalResume: resumeText,
        notes,
        projectMaterials: projectMaterialsText
      }),
      text: {
        format: zodTextFormat(resumeBaselineReviewSchema, "resume_baseline_review")
      }
    });

    const baselineReview = baselineResponse.output_parsed;
    if (!baselineReview) {
      throw new Error("原始简历诊断失败。");
    }

    const optimizationResponse = await client.responses.parse({
      model: "gpt-4.1-nano",
      instructions: buildResumeOptimizationInstructions(),
      input: buildResumeOptimizationPrompt({
        jobProfile: baselineReview.jobProfile,
        directEdits: baselineReview.directEdits,
        needsUserInputEdits: baselineReview.needsUserInputEdits,
        keywordGapAnalysis: baselineReview.keywordGapAnalysis,
        originalResume: resumeText,
        notes,
        revisionNotes: body.revisionNotes?.trim() ?? "",
        projectMaterials: projectMaterialsText
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
        jobProfile: baselineReview.jobProfile,
        optimizedResumeText: optimizationOutput.optimizedResume.plainTextResume,
        optimizedResumeMarkdown: optimizationOutput.optimizedResume.markdownResume,
        optimizedResumeDoc: {
          candidateName: optimizationOutput.optimizedResume.candidateName,
          headline: optimizationOutput.optimizedResume.headline,
          contactLines: optimizationOutput.optimizedResume.contactLines,
          summary: optimizationOutput.optimizedResume.summary,
          experience: optimizationOutput.optimizedResume.experience,
          projects: optimizationOutput.optimizedResume.projects,
          education: optimizationOutput.optimizedResume.education,
          skills: optimizationOutput.optimizedResume.skills,
          additionalSections: optimizationOutput.optimizedResume.additionalSections
        },
        jobKeywords: optimizationOutput.optimizedResume.highlightedKeywords,
        directEdits: baselineReview.directEdits,
        needsUserInputEdits: baselineReview.needsUserInputEdits,
        keywordGapAnalysis: baselineReview.keywordGapAnalysis,
        gapAnalysis: optimizationOutput.gapAnalysis,
        coverLetterTalkingPoints: optimizationOutput.coverLetterTalkingPoints,
        changeLog: optimizationOutput.optimizedResume.changeLog,
        riskNotes: optimizationOutput.optimizedResume.riskNotes,
        beforeScores: baselineReview.baselineScores,
        afterScores: optimizationOutput.afterScores,
        overallDelta:
          Math.round(
            (optimizationOutput.afterScores.overallScore - baselineReview.baselineScores.overallScore) *
              10
          ) / 10,
        summary: optimizationOutput.summary
      }
    });
  } catch (error) {
    return NextResponse.json(
      { detail: buildErrorMessage(error) },
      { status: 500 }
    );
  }
}

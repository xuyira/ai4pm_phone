import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIClient } from "@/lib/ai/openai";
import {
  buildResumeDiagnosisInstructions,
  buildResumeDiagnosisPrompt,
  buildResumeOptimizationInstructions,
  buildResumeOptimizationPrompt
} from "@/lib/ai/prompts";
import {
  jdResumeEvidenceItemSchema,
  jobProfileSchema,
  resumeDiagnosisSchema,
  resumeOptimizationOutputSchema
} from "@/lib/ai/schemas";

export type DiagnoseRequest = {
  jobTitle: string;
  jobType: "intern" | "fulltime";
  jobDescription: string;
  notes: string;
  resumeText: string;
  projectMaterialsText?: string;
};

export type OptimizeRequest = {
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
    relatedRequirement?: string;
  }>;
  quickSupplementAnswers?: Record<string, string>;
};

export function buildResumeAiErrorMessage(error: unknown, fallback: string) {
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

  return fallback;
}

export function parseDiagnoseRequest(body: Partial<DiagnoseRequest>) {
  const jobTitle = body.jobTitle?.trim() ?? "";
  const jobType = body.jobType ?? "intern";
  const jobDescription = body.jobDescription?.trim() ?? "";
  const notes = body.notes?.trim() ?? "";
  const resumeText = body.resumeText?.trim() ?? "";
  const projectMaterialsText = body.projectMaterialsText?.trim() ?? "";

  if (!resumeText) {
    throw new Error("缺少简历文本。");
  }

  if (!jobDescription) {
    throw new Error("缺少目标岗位 JD。");
  }

  return {
    jobTitle,
    jobType,
    jobDescription,
    notes,
    resumeText,
    projectMaterialsText
  } satisfies DiagnoseRequest;
}

export async function runResumeDiagnosis(input: DiagnoseRequest) {
  const client = getOpenAIClient();
  const diagnosisResponse = await client.responses.parse({
    model: "gpt-5.4-nano",
    instructions: buildResumeDiagnosisInstructions(),
    input: buildResumeDiagnosisPrompt({
      jobTitle: input.jobTitle,
      jobType: input.jobType,
      jobDescription: input.jobDescription,
      originalResume: input.resumeText,
      notes: input.notes,
      projectMaterials: input.projectMaterialsText || ""
    }),
    text: {
      format: zodTextFormat(resumeDiagnosisSchema, "resume_diagnosis")
    }
  });

  const diagnosis = diagnosisResponse.output_parsed;
  if (!diagnosis) {
    throw new Error("简历诊断失败。");
  }

  return {
    ...diagnosis,
    rawModelOutput: diagnosisResponse.output_text || JSON.stringify(diagnosis, null, 2)
  };
}

export function parseOptimizeRequest(body: Partial<OptimizeRequest>) {
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
    throw new Error("缺少第二阶段简历优化所需信息。");
  }

  return {
    jobProfile,
    jdResumeEvidenceMatrix,
    originalJobDescription,
    originalResumeText,
    diagnosisScores,
    diagnosisActions,
    quickSupplementQuestions,
    quickSupplementAnswers
  };
}

export async function runResumeOptimization(input: ReturnType<typeof parseOptimizeRequest>) {
  const client = getOpenAIClient();

  const optimizationResponse = await client.responses.parse({
    model: "gpt-5.4-nano",
    instructions: buildResumeOptimizationInstructions(),
    input: buildResumeOptimizationPrompt({
      jobProfile: input.jobProfile,
      jdResumeEvidenceMatrix: input.jdResumeEvidenceMatrix,
      originalJobDescription: input.originalJobDescription,
      originalResumeText: input.originalResumeText,
      diagnosisScores: input.diagnosisScores,
      diagnosisActions: input.diagnosisActions,
      quickSupplementQuestions: input.quickSupplementQuestions,
      quickSupplementAnswers: input.quickSupplementAnswers
    }),
    text: {
      format: zodTextFormat(resumeOptimizationOutputSchema, "resume_optimization_output")
    }
  });

  const optimizationOutput = optimizationResponse.output_parsed;
  if (!optimizationOutput) {
    throw new Error("优化结果生成失败。");
  }

  const normalizeTitle = (value: string) =>
    value
      .replace(/\s+/g, "")
      .replace(/[()（）【】\[\]《》<>·•,，.。:：;；'"“”‘’\-_/\\|]/g, "")
      .toLowerCase();

  const dedupeOptimizedResumeProfile = (profile: typeof optimizationOutput.optimizedResumeProfile) => {
    const normalizeLooseText = (value: string) =>
      value
        .replace(/\s+/g, "")
        .replace(/[()（）【】\[\]《》<>·•,，.。:：;；'"“”‘’\-_/\\|]/g, "")
        .replace(/（以原文为准）/g, "")
        .toLowerCase();

    const projectKeys = new Set(
      profile.projectExperience
        .map((item) => normalizeTitle(item.projectName))
        .filter(Boolean)
    );

    const filteredWorkExperience = profile.workExperience.filter((item) => {
      const companyKey = normalizeTitle(item.company);
      if (!companyKey) {
        return true;
      }

      for (const projectKey of projectKeys) {
        if (!projectKey) {
          continue;
        }

        const sameOrContained =
          companyKey === projectKey ||
          companyKey.includes(projectKey) ||
          projectKey.includes(companyKey);

        if (sameOrContained) {
          return false;
        }
      }

      return true;
    });

    const normalizedAchievements = profile.achievements.map((item) => {
      const name = item.name.trim();
      const description = item.description.trim();
      const type = item.type.trim();
      const date = item.date.trim();

      const nameKey = normalizeLooseText(name);
      const descriptionKey = normalizeLooseText(description);

      let nextDescription = description;

      if (!descriptionKey || descriptionKey === nameKey) {
        nextDescription = "";
      } else if (nameKey && descriptionKey.includes(nameKey)) {
        nextDescription = description.replace(item.name, "").trim();
      }

      nextDescription = nextDescription
        .replace(/^[：:\-—\s，,；;]+|[：:\-—\s，,；;]+$/g, "")
        .replace(/\s{2,}/g, " ");

      const nextName =
        !name && nextDescription
          ? nextDescription.split(/[；;。.!！?？]/)[0].trim()
          : name;

      return {
        ...item,
        name: nextName,
        type,
        date,
        description: nextDescription
      };
    }).filter((item) => item.name || item.description);

    return {
      ...profile,
      workExperience: filteredWorkExperience,
      achievements: normalizedAchievements
    };
  };

  const normalizedProfile = dedupeOptimizedResumeProfile(optimizationOutput.optimizedResumeProfile);

  return {
    jobProfile: input.jobProfile,
    jdResumeEvidenceMatrix: input.jdResumeEvidenceMatrix,
    optimizedResumeProfile: normalizedProfile,
    optimizedResumeText: JSON.stringify(normalizedProfile, null, 2),
    beforeScores: input.diagnosisScores,
    afterScores: optimizationOutput.optimizedDiagnosisScores,
    finalSummary: optimizationOutput.finalSummary,
    rawModelOutput:
      optimizationResponse.output_text || JSON.stringify(optimizationOutput, null, 2)
  };
}

import { z } from "zod";

const dimensionScoreSchema = z.object({
  score: z.number().min(0).max(100),
  reason: z.string(),
  evidence: z.array(z.string()).min(1).max(4),
  improvement: z.string()
});

const diagnosisDimensionSchema = z.object({
  score: z.number().min(0).max(10),
  reason: z.string(),
  improvement: z.string(),
  priority: z.enum(["high", "medium", "low"])
});

const quickSupplementQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  whyAsk: z.string(),
  sourceDimensions: z.array(
    z.enum([
      "structureClarity",
      "languageProfessionalism",
      "priorityFocus",
      "productExpression",
      "resultQuantification",
      "hardRequirementFit",
      "responsibilityCoverage",
      "industryRelevance"
    ])
  ).min(1).max(2),
  relatedRequirement: z.string()
});

export const jdResumeEvidenceItemSchema = z.object({
  requirement: z.string(),
  requirementType: z.enum(["必需项", "核心职责", "加分项", "隐形信号"]),
  resumeEvidence: z.string(),
  matchType: z.enum(["strong", "partial", "transferable", "missing", "unsupported"]),
  gap: z.string(),
  supplementDirection: z.string()
});

const resumeBasicInfoSchema = z.object({
  name: z.string(),
  gender: z.string(),
  phone: z.string(),
  email: z.string()
});

const resumeJobIntentSchema = z.object({
  targetRole: z.string().default(""),
  targetCity: z.string(),
  earliestStartDate: z.string(),
  internshipDuration: z.string(),
  weeklyAvailability: z.string()
});

const resumeEducationItemSchema = z.object({
  degree: z.string(),
  school: z.string(),
  college: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  major: z.string(),
  gpa: z.string(),
  description: z.string()
});

const resumeExperienceItemSchema = z.object({
  company: z.string(),
  position: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.array(z.string())
});

const resumeProjectItemSchema = z.object({
  projectName: z.string(),
  role: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.array(z.string())
});

const resumeAchievementItemSchema = z.object({
  type: z.string(),
  name: z.string(),
  date: z.string(),
  description: z.string()
});

const resumeSkillProfileSchema = z.object({
  languages: z.array(z.string()),
  tools: z.array(z.string()),
  productSkills: z.array(z.string()),
  technicalSkills: z.array(z.string()),
  aiSkills: z.array(z.string()),
  certificates: z.array(z.string())
});

export const resumeProfileSchema = z.object({
  basicInfo: resumeBasicInfoSchema,
  jobIntent: resumeJobIntentSchema,
  education: z.array(resumeEducationItemSchema),
  workExperience: z.array(resumeExperienceItemSchema),
  projectExperience: z.array(resumeProjectItemSchema),
  achievements: z.array(resumeAchievementItemSchema),
  skills: resumeSkillProfileSchema
});

export const jobProfileSchema = z.object({
  roleTitle: z.string(),
  roleType: z.string(),
  industryScenario: z.array(z.string()).min(1).max(8),
  coreResponsibilities: z.array(z.string()).min(3).max(8),
  requiredCapabilities: z.array(z.string()).min(3).max(8),
  preferredCapabilities: z.array(z.string()).min(0).max(6),
  toolsAndKeywords: z.array(z.string()).min(3).max(20),
  hiddenSignals: z.array(z.string()).min(1).max(8)
});

export const structuredSectionSchema = z.object({
  title: z.string(),
  subtitle: z.string().default(""),
  bullets: z.array(z.string()).min(1).max(5)
});

export const optimizedResumeSchema = z.object({
  candidateName: z.string(),
  headline: z.string(),
  contactLines: z.array(z.string()).min(1).max(4),
  summary: z.array(z.string()).min(2).max(4),
  experience: z.array(structuredSectionSchema).min(1).max(5),
  projects: z.array(structuredSectionSchema).max(4),
  education: z.array(structuredSectionSchema).min(1).max(3),
  skills: z.array(z.string()).min(4).max(20),
  additionalSections: z.array(structuredSectionSchema).max(3),
  highlightedKeywords: z.array(z.string()).min(6).max(20),
  changeLog: z.array(z.string()).min(4).max(10),
  riskNotes: z.array(z.string()).min(1).max(6),
  plainTextResume: z.string(),
  markdownResume: z.string()
});

const optimizedDiagnosisDimensionSchema = z.object({
  originalScore: z.number().min(0).max(10),
  delta: z.number().min(0).max(3),
  finalScore: z.number().min(0).max(10),
  reason: z.string()
});

const finalSummarySchema = z.object({
  strengths: z.array(z.string()).min(3).max(3),
  gaps: z.array(z.string()).min(3).max(3),
  applicationLevel: z.enum(["较强", "中等偏上", "中等", "较弱"]),
  encouragement: z.string()
});

export const keywordGapItemSchema = z.object({
  keyword: z.string(),
  inOriginalResume: z.boolean(),
  inOptimizedResume: z.boolean(),
  recommendation: z.string()
});

export const gapAnalysisSchema = z.object({
  strongMatches: z.array(z.string()).min(2).max(6),
  reframedMatches: z.array(z.string()).min(2).max(6),
  remainingGaps: z.array(z.string()).min(1).max(6)
});

export const baselineFindingSchema = z.object({
  dimension: z.string(),
  issue: z.string(),
  evidence: z.array(z.string()).min(1).max(3),
  recommendation: z.string()
});

export const rewritePrioritySchema = z.object({
  priority: z.enum(["high", "medium", "low"]),
  targetSection: z.string(),
  instruction: z.string(),
  reason: z.string()
});

export const directEditSchema = z.object({
  title: z.string(),
  targetSection: z.string(),
  currentText: z.string(),
  suggestedText: z.string(),
  improvesDimensions: z.array(z.string()).min(1).max(3),
  reason: z.string()
});

export const needsUserInputEditSchema = z.object({
  title: z.string(),
  targetSection: z.string(),
  currentText: z.string(),
  missingInfoQuestions: z.array(z.string()).min(1).max(4),
  suggestedDirection: z.string(),
  improvesDimensions: z.array(z.string()).min(1).max(3),
  reason: z.string()
});

export const resumeDiagnosisSchema = z.object({
  jobProfile: jobProfileSchema,
  jdResumeEvidenceMatrix: z.array(jdResumeEvidenceItemSchema).min(5).max(8),
  quickSupplementQuestions: z.array(quickSupplementQuestionSchema).min(3).max(5),
  diagnosisScores: z.object({
    structureClarity: diagnosisDimensionSchema,
    languageProfessionalism: diagnosisDimensionSchema,
    priorityFocus: diagnosisDimensionSchema,
    productExpression: diagnosisDimensionSchema,
    resultQuantification: diagnosisDimensionSchema,
    hardRequirementFit: diagnosisDimensionSchema,
    responsibilityCoverage: diagnosisDimensionSchema,
    industryRelevance: diagnosisDimensionSchema
  }),
  summary: z.string().optional().default("")
});

export const scoreSummarySchema = z.object({
  resumePresentation: z.object({
    structureClarity: dimensionScoreSchema,
    informationCompleteness: dimensionScoreSchema,
    resultQuantification: dimensionScoreSchema,
    productExpression: dimensionScoreSchema,
    priorityFocus: dimensionScoreSchema,
    averageScore: z.number().min(0).max(100)
  }),
  jobMatch: z.object({
    responsibilityCoverage: dimensionScoreSchema,
    industryRelevance: dimensionScoreSchema,
    atsKeywordMatch: dimensionScoreSchema,
    hardRequirementFit: dimensionScoreSchema,
    averageScore: z.number().min(0).max(100)
  }),
  overallScore: z.number().min(0).max(100)
});

export const resumeBaselineReviewSchema = z.object({
  jobProfile: jobProfileSchema,
  baselineScores: scoreSummarySchema,
  directEdits: z.array(directEditSchema).length(3),
  needsUserInputEdits: z.array(needsUserInputEditSchema).length(3),
  keywordGapAnalysis: z.array(keywordGapItemSchema).min(4).max(12),
  summary: z.string()
});

export const resumeOptimizationOutputSchema = z.object({
  optimizedResumeProfile: resumeProfileSchema,
  optimizedDiagnosisScores: z.object({
    structureClarity: optimizedDiagnosisDimensionSchema,
    languageProfessionalism: optimizedDiagnosisDimensionSchema,
    priorityFocus: optimizedDiagnosisDimensionSchema,
    productExpression: optimizedDiagnosisDimensionSchema,
    resultQuantification: optimizedDiagnosisDimensionSchema,
    hardRequirementFit: optimizedDiagnosisDimensionSchema,
    responsibilityCoverage: optimizedDiagnosisDimensionSchema,
    industryRelevance: optimizedDiagnosisDimensionSchema
  }),
  finalSummary: finalSummarySchema
});

export const resumeScoringSchema = z.object({
  before: scoreSummarySchema,
  after: scoreSummarySchema,
  overallDelta: z.number(),
  summary: z.string(),
  strengths: z.array(z.string()).min(3).max(6),
  risks: z.array(z.string()).min(1).max(5)
});

export type JobProfile = z.infer<typeof jobProfileSchema>;
export type OptimizedResume = z.infer<typeof optimizedResumeSchema>;
export type ResumeScoring = z.infer<typeof resumeScoringSchema>;
export type ResumeDiagnosis = z.infer<typeof resumeDiagnosisSchema>;
export type ResumeOptimizationOutput = z.infer<typeof resumeOptimizationOutputSchema>;
export type JdResumeEvidenceItem = z.infer<typeof jdResumeEvidenceItemSchema>;

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
  improvement: z.string()
});

const resumeBasicInfoSchema = z.object({
  name: z.string(),
  gender: z.string(),
  phone: z.string(),
  email: z.string()
});

const resumeJobIntentSchema = z.object({
  targetCity: z.string(),
  earliestStartDate: z.string(),
  internshipDuration: z.string(),
  weeklyAvailability: z.string()
});

const resumeEducationItemSchema = z.object({
  degree: z.string(),
  school: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  department: z.string(),
  major: z.string(),
  gpa: z.string()
});

const resumeExperienceItemSchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string()
});

const resumeProjectItemSchema = z.object({
  projectName: z.string(),
  role: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string()
});

const resumeAwardItemSchema = z.object({
  awardType: z.string(),
  awardName: z.string(),
  awardDate: z.string()
});

const resumeSkillProfileSchema = z.object({
  languageTests: z.array(z.string()),
  programmingLanguages: z.array(z.string()),
  aiSkills: z.array(z.string())
});

export const resumeProfileSchema = z.object({
  basicInfo: resumeBasicInfoSchema,
  jobIntent: resumeJobIntentSchema,
  education: z.array(resumeEducationItemSchema),
  workExperience: z.array(resumeExperienceItemSchema),
  projectExperience: z.array(resumeProjectItemSchema),
  awards: z.array(resumeAwardItemSchema),
  skills: resumeSkillProfileSchema
});

export const jobProfileSchema = z.object({
  targetTitle: z.string(),
  jobTypeLabel: z.enum(["校招/实习", "社招"]),
  seniority: z.string(),
  coreResponsibilities: z.array(z.string()).min(3).max(8),
  mustHaveRequirements: z.array(z.string()).min(3).max(8),
  preferredRequirements: z.array(z.string()).min(0).max(6),
  keywords: z.array(z.string()).min(6).max(20),
  industrySignals: z.array(z.string()).min(1).max(8),
  productCapabilities: z.array(z.string()).min(4).max(10),
  atsTerms: z.array(z.string()).min(6).max(20),
  hardRequirements: z.array(z.string()).min(1).max(8),
  summary: z.string()
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
  delta: z.number().min(0).max(5),
  finalScore: z.number().min(0).max(10),
  reason: z.string()
});

const optimizationGapItemSchema = z.object({
  gap: z.string(),
  suggestion: z.string()
});

const successPredictionSchema = z.object({
  level: z.enum(["成功率较高", "成功率中等", "成功率较低"]),
  reason: z.string(),
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
  resumeProfile: resumeProfileSchema,
  diagnosisScores: z.object({
    structureClarity: diagnosisDimensionSchema,
    resultQuantification: diagnosisDimensionSchema,
    productExpression: diagnosisDimensionSchema,
    languageProfessionalism: diagnosisDimensionSchema,
    responsibilityCoverage: diagnosisDimensionSchema,
    industryRelevance: diagnosisDimensionSchema,
    hardRequirementFit: diagnosisDimensionSchema
  }),
  summary: z.string()
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
    resultQuantification: optimizedDiagnosisDimensionSchema,
    productExpression: optimizedDiagnosisDimensionSchema,
    languageProfessionalism: optimizedDiagnosisDimensionSchema,
    responsibilityCoverage: optimizedDiagnosisDimensionSchema,
    industryRelevance: optimizedDiagnosisDimensionSchema,
    hardRequirementFit: optimizedDiagnosisDimensionSchema
  }),
  strengths: z.array(z.string()).length(3),
  gaps: z.array(optimizationGapItemSchema).length(3),
  successPrediction: successPredictionSchema
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

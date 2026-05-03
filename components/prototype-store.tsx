"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { PrototypeStoreToastProvider } from "@/components/toast";
import { records as staticRecords, type FeatureType, type RecordItem } from "@/lib/prototype-data";

export type ResumeJobType = "intern" | "fulltime";

export type ResumeExtraction = {
  filename: string;
  fileType: "pdf" | "docx";
  parser: string;
  format: "markdown" | "text";
  charCount: number;
  lineCount: number;
  qualityFlag: "good" | "review_needed";
  warnings: string[];
  content: string;
};

export type ResumeDraft = {
  jobTitle: string;
  jobType: ResumeJobType;
  jobDescription: string;
  notes: string;
  extractedResume: ResumeExtraction | null;
  projectMaterials: ResumeExtraction | null;
};

export type ResumeDiagnosisActionInput = {
  dimension: string;
  adopted: boolean;
  userComment: string;
};

export type ResumeDimensionScore = {
  score: number;
  reason: string;
  evidence: string[];
  improvement: string;
};

export type ResumePresentationScorecard = {
  structureClarity: ResumeDimensionScore;
  informationCompleteness: ResumeDimensionScore;
  resultQuantification: ResumeDimensionScore;
  productExpression: ResumeDimensionScore;
  priorityFocus: ResumeDimensionScore;
  averageScore: number;
};

export type ResumeJobMatchScorecard = {
  responsibilityCoverage: ResumeDimensionScore;
  industryRelevance: ResumeDimensionScore;
  atsKeywordMatch: ResumeDimensionScore;
  hardRequirementFit: ResumeDimensionScore;
  averageScore: number;
};

export type ResumeScoreSummary = {
  resumePresentation: ResumePresentationScorecard;
  jobMatch: ResumeJobMatchScorecard;
  overallScore: number;
};

export type ResumeStructuredSection = {
  title: string;
  subtitle?: string;
  bullets: string[];
};

export type ResumeStructuredDocument = {
  candidateName: string;
  headline: string;
  contactLines: string[];
  summary: string[];
  experience: ResumeStructuredSection[];
  projects: ResumeStructuredSection[];
  education: ResumeStructuredSection[];
  skills: string[];
  additionalSections: ResumeStructuredSection[];
};

export type ResumeKeywordGapItem = {
  keyword: string;
  inOriginalResume: boolean;
  inOptimizedResume: boolean;
  recommendation: string;
};

export type ResumeGapAnalysis = {
  strongMatches: string[];
  reframedMatches: string[];
  remainingGaps: string[];
};

export type ResumeBaselineFinding = {
  dimension: string;
  issue: string;
  evidence: string[];
  recommendation: string;
};

export type ResumeRewritePriority = {
  priority: "high" | "medium" | "low";
  targetSection: string;
  instruction: string;
  reason: string;
};

export type ResumeDirectEdit = {
  title: string;
  targetSection: string;
  currentText: string;
  suggestedText: string;
  improvesDimensions: string[];
  reason: string;
};

export type ResumeNeedsUserInputEdit = {
  title: string;
  targetSection: string;
  currentText: string;
  missingInfoQuestions: string[];
  suggestedDirection: string;
  improvesDimensions: string[];
  reason: string;
};

export type ResumeDiagnosisDimension = {
  score: number;
  reason: string;
  improvement: string;
  priority: "high" | "medium" | "low";
};

export type ResumeQuickSupplementQuestion = {
  id: string;
  question: string;
  whyAsk: string;
};

export type ResumeDiagnosisScores = {
  structureClarity: ResumeDiagnosisDimension;
  languageProfessionalism: ResumeDiagnosisDimension;
  priorityFocus: ResumeDiagnosisDimension;
  productExpression: ResumeDiagnosisDimension;
  resultQuantification: ResumeDiagnosisDimension;
  hardRequirementFit: ResumeDiagnosisDimension;
  responsibilityCoverage: ResumeDiagnosisDimension;
  industryRelevance: ResumeDiagnosisDimension;
};

export type ResumeOptimizationUnsupportedAction = {
  dimension: string;
  suggestion: string;
  reason: string;
  neededUserInput: string;
};

export type ResumeOptimizationFinalSummary = {
  positioning: string;
  strengths: string[];
  gaps: string[];
  applicationCompetitiveness: {
    level: string;
    reason: string;
  };
  encouragement: string;
};

export type ResumeProfileBasicInfo = {
  name: string;
  gender: string;
  phone: string;
  email: string;
};

export type ResumeProfileJobIntent = {
  targetCity: string;
  earliestStartDate: string;
  internshipDuration: string;
  weeklyAvailability: string;
};

export type ResumeProfileEducationItem = {
  degree: string;
  school: string;
  startDate: string;
  endDate: string;
  department: string;
  major: string;
  gpa: string;
};

export type ResumeProfileWorkItem = {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type ResumeProfileProjectItem = {
  projectName: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type ResumeProfileAwardItem = {
  awardType: string;
  awardName: string;
  awardDate: string;
};

export type ResumeProfileSkills = {
  languageTests: string[];
  programmingLanguages: string[];
  aiSkills: string[];
};

export type ResumeProfile = {
  basicInfo: ResumeProfileBasicInfo;
  jobIntent: ResumeProfileJobIntent;
  education: ResumeProfileEducationItem[];
  workExperience: ResumeProfileWorkItem[];
  projectExperience: ResumeProfileProjectItem[];
  awards: ResumeProfileAwardItem[];
  skills: ResumeProfileSkills;
};

export type ResumeDiagnosisResult = {
  jobProfile: {
    targetTitle: string;
    jobTypeLabel: "校招/实习" | "社招";
    seniority: string;
    coreResponsibilities: string[];
    mustHaveRequirements: string[];
    preferredRequirements: string[];
    keywords: string[];
    industrySignals: string[];
    productCapabilities: string[];
    atsTerms: string[];
    hardRequirements: string[];
    summary: string;
  };
  resumeProfile: ResumeProfile;
  quickSupplementQuestions: ResumeQuickSupplementQuestion[];
  diagnosisScores: ResumeDiagnosisScores;
  summary: string;
  rawModelOutput: string;
};

export type ResumeOptimizationResult = {
  jobProfile: {
    targetTitle: string;
    jobTypeLabel: "校招/实习" | "社招";
    seniority: string;
    coreResponsibilities: string[];
    mustHaveRequirements: string[];
    preferredRequirements: string[];
    keywords: string[];
    industrySignals: string[];
    productCapabilities: string[];
    atsTerms: string[];
    hardRequirements: string[];
    summary: string;
  };
  optimizedResumeProfile: ResumeProfile;
  optimizedResumeText: string;
  beforeScores: ResumeDiagnosisScores;
  afterScores: {
    structureClarity: {
      originalScore: number;
      delta: number;
      finalScore: number;
      reason: string;
    };
    languageProfessionalism: {
      originalScore: number;
      delta: number;
      finalScore: number;
      reason: string;
    };
    priorityFocus: {
      originalScore: number;
      delta: number;
      finalScore: number;
      reason: string;
    };
    productExpression: {
      originalScore: number;
      delta: number;
      finalScore: number;
      reason: string;
    };
    resultQuantification: {
      originalScore: number;
      delta: number;
      finalScore: number;
      reason: string;
    };
    hardRequirementFit: {
      originalScore: number;
      delta: number;
      finalScore: number;
      reason: string;
    };
    responsibilityCoverage: {
      originalScore: number;
      delta: number;
      finalScore: number;
      reason: string;
    };
    industryRelevance: {
      originalScore: number;
      delta: number;
      finalScore: number;
      reason: string;
    };
  };
  unsupportedActions: ResumeOptimizationUnsupportedAction[];
  finalSummary: ResumeOptimizationFinalSummary;
  rawModelOutput: string;
};

export type ResumeOptimizationStatus = "idle" | "running" | "completed" | "failed";
export type ResumeRecordStatus =
  | "uploaded"
  | "diagnosing"
  | "diagnosed"
  | "optimizing"
  | "optimized"
  | "diagnose_failed"
  | "optimize_failed";

export type ResumeFlowRecord = {
  id: string;
  type: "resume";
  jobTitle: string;
  title: string;
  timestamp: string;
  updatedAt: number;
  status: ResumeRecordStatus;
  draft: ResumeDraft;
  diagnosis: ResumeDiagnosisResult | null;
  diagnosisActions: ResumeDiagnosisActionInput[];
  quickSupplementAnswers: Record<string, string>;
  optimization: ResumeOptimizationResult | null;
  lastError: string | null;
};

type PrototypeStoreValue = {
  isHydrated: boolean;
  currentResumeRecordId: string | null;
  records: RecordItem[];
  resumeRecords: ResumeFlowRecord[];
  resumeDraft: ResumeDraft;
  resumeDiagnosis: ResumeDiagnosisResult | null;
  resumeDiagnosisActions: ResumeDiagnosisActionInput[];
  resumeQuickSupplementAnswers: Record<string, string>;
  resumeDiagnosisStatus: ResumeOptimizationStatus;
  resumeDiagnosisError: string | null;
  resumeOptimization: ResumeOptimizationResult | null;
  resumeOptimizationStatus: ResumeOptimizationStatus;
  resumeOptimizationError: string | null;
  deleteRecord: (id: string) => void;
  getRecord: (id: string) => RecordItem | undefined;
  getResumeRecord: (id: string) => ResumeFlowRecord | undefined;
  getRecordsByType: (type: FeatureType) => RecordItem[];
  restoreResumeRecord: (id: string) => boolean;
  ensureResumeRecord: (status: ResumeRecordStatus) => string | null;
  updateResumeRecordStatus: (
    status: ResumeRecordStatus,
    options?: {
      error?: string | null;
      diagnosis?: ResumeDiagnosisResult | null;
      optimization?: ResumeOptimizationResult | null;
      diagnosisActions?: ResumeDiagnosisActionInput[];
      quickSupplementAnswers?: Record<string, string>;
    }
  ) => void;
  updateResumeDraft: (patch: Partial<ResumeDraft>) => void;
  setResumeExtraction: (extraction: ResumeExtraction) => void;
  setProjectMaterials: (materials: ResumeExtraction) => void;
  setResumeDiagnosis: (result: ResumeDiagnosisResult) => void;
  setResumeDiagnosisActions: (actions: ResumeDiagnosisActionInput[]) => void;
  setResumeQuickSupplementAnswers: (answers: Record<string, string>) => void;
  setResumeDiagnosisStatus: (status: ResumeOptimizationStatus, error?: string | null) => void;
  setResumeOptimization: (result: ResumeOptimizationResult) => void;
  setResumeOptimizationStatus: (
    status: ResumeOptimizationStatus,
    error?: string | null
  ) => void;
  clearResumeDiagnosis: () => void;
  clearResumeOptimization: () => void;
  clearResumeDraft: () => void;
};

const HIDDEN_KEY = "ai4pm-hidden-records";
const RESUME_RECORDS_KEY = "ai4pm-resume-records";
const defaultResumeDraft: ResumeDraft = {
  jobTitle: "",
  jobType: "intern",
  jobDescription: "",
  notes: "",
  extractedResume: null,
  projectMaterials: null
};
const PrototypeStore = createContext<PrototypeStoreValue | null>(null);

function formatTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

function cloneDraft(draft: ResumeDraft): ResumeDraft {
  return JSON.parse(JSON.stringify(draft)) as ResumeDraft;
}

function buildResumeRecordItem(record: ResumeFlowRecord): RecordItem {
  return {
    id: record.id,
    type: "resume",
    title: record.title,
    subtitle: "",
    timestamp: record.timestamp,
    status: record.status,
    route: `/profile/records/resume/${record.id}`,
    description: ""
  };
}

function getRecordProgressRank(status: ResumeRecordStatus) {
  if (status === "optimized" || status === "optimize_failed") {
    return 3;
  }

  if (status === "optimizing" || status === "diagnosed") {
    return 2;
  }

  return 1;
}

function normalizeResumeRecords(records: ResumeFlowRecord[]) {
  const sorted = records
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const merged = new Map<string, ResumeFlowRecord>();

  for (const record of sorted) {
    const signature = JSON.stringify({
      jobTitle: record.jobTitle,
      jobType: record.draft.jobType,
      jobDescription: record.draft.jobDescription,
      notes: record.draft.notes,
      resumeFilename: record.draft.extractedResume?.filename || "",
      resumeContent: record.draft.extractedResume?.content || ""
    });
    const existing = merged.get(signature);

    if (!existing || Math.abs(existing.updatedAt - record.updatedAt) > 30 * 60 * 1000) {
      merged.set(signature, {
        ...record,
        quickSupplementAnswers: record.quickSupplementAnswers || {}
      });
      continue;
    }

    const keep = getRecordProgressRank(record.status) > getRecordProgressRank(existing.status)
      ? record
      : existing;
    const mergeFrom = keep === record ? existing : record;

    merged.set(signature, {
      ...keep,
      diagnosis: keep.diagnosis || mergeFrom.diagnosis,
      diagnosisActions:
        keep.diagnosisActions.length > 0 ? keep.diagnosisActions : mergeFrom.diagnosisActions,
      quickSupplementAnswers:
        Object.keys(keep.quickSupplementAnswers || {}).length > 0
          ? keep.quickSupplementAnswers
          : mergeFrom.quickSupplementAnswers || {},
      optimization: keep.optimization || mergeFrom.optimization,
      lastError: keep.lastError || mergeFrom.lastError || null
    });
  }

  return Array.from(merged.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function PrototypeStoreProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [resumeRecords, setResumeRecords] = useState<ResumeFlowRecord[]>([]);
  const [currentResumeRecordId, setCurrentResumeRecordId] = useState<string | null>(null);
  const [resumeDraft, setResumeDraft] = useState<ResumeDraft>(defaultResumeDraft);
  const [resumeDiagnosis, setResumeDiagnosisState] = useState<ResumeDiagnosisResult | null>(null);
  const [resumeDiagnosisActions, setResumeDiagnosisActionsState] = useState<
    ResumeDiagnosisActionInput[]
  >([]);
  const [resumeQuickSupplementAnswers, setResumeQuickSupplementAnswersState] = useState<
    Record<string, string>
  >({});
  const [resumeDiagnosisStatus, setResumeDiagnosisStatusState] =
    useState<ResumeOptimizationStatus>("idle");
  const [resumeDiagnosisError, setResumeDiagnosisError] = useState<string | null>(null);
  const [resumeOptimization, setResumeOptimizationState] =
    useState<ResumeOptimizationResult | null>(null);
  const [resumeOptimizationStatus, setResumeOptimizationStatusState] =
    useState<ResumeOptimizationStatus>("idle");
  const [resumeOptimizationError, setResumeOptimizationError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(HIDDEN_KEY);
    if (saved) {
      setHiddenIds(JSON.parse(saved) as string[]);
    }

    const savedResumeRecords = window.localStorage.getItem(RESUME_RECORDS_KEY);
    if (savedResumeRecords) {
      const parsed = JSON.parse(savedResumeRecords) as ResumeFlowRecord[];
      setResumeRecords(normalizeResumeRecords(parsed));
    }

    setIsHydrated(true);
  }, []);

  const deleteRecord = useCallback((id: string) => {
    let deletedResume = false;
    setResumeRecords((current) => {
      const next = current.filter((item) => item.id !== id);
      deletedResume = next.length !== current.length;
      return next;
    });

    if (deletedResume) {
      if (currentResumeRecordId === id) {
        setCurrentResumeRecordId(null);
      }
      return;
    }

    setHiddenIds((current) => {
      return current.includes(id) ? current : [...current, id];
    });
  }, [currentResumeRecordId]);

  const upsertResumeRecord = useCallback((record: ResumeFlowRecord) => {
    setResumeRecords((current) => {
      const next = current.filter((item) => item.id !== record.id);
      return [record, ...next].sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }, []);

  const ensureResumeRecord = useCallback((status: ResumeRecordStatus) => {
    const now = Date.now();
    const recordId = currentResumeRecordId ?? `resume-${now}`;
    const existingRecord = resumeRecords.find((item) => item.id === recordId);
    const nextRecord: ResumeFlowRecord = {
      id: recordId,
      type: "resume",
      jobTitle: resumeDraft.jobTitle.trim() || existingRecord?.jobTitle || "",
      title: resumeDraft.jobTitle.trim() || existingRecord?.title || "历史记录",
      timestamp: existingRecord?.timestamp || formatTimestamp(new Date(now)),
      updatedAt: now,
      status,
      draft: cloneDraft(resumeDraft),
      diagnosis: existingRecord?.diagnosis || null,
      diagnosisActions: existingRecord?.diagnosisActions || [],
      quickSupplementAnswers: existingRecord?.quickSupplementAnswers || {},
      optimization: existingRecord?.optimization || null,
      lastError: null
    };

    upsertResumeRecord(nextRecord);
    setCurrentResumeRecordId(recordId);
    return recordId;
  }, [currentResumeRecordId, resumeDraft, resumeRecords, upsertResumeRecord]);

  const updateResumeRecordStatus = useCallback(
    (
      status: ResumeRecordStatus,
      options?: {
        error?: string | null;
        diagnosis?: ResumeDiagnosisResult | null;
        optimization?: ResumeOptimizationResult | null;
        diagnosisActions?: ResumeDiagnosisActionInput[];
        quickSupplementAnswers?: Record<string, string>;
      }
    ) => {
      if (!currentResumeRecordId) {
        return;
      }

      setResumeRecords((current) =>
        current
          .map((item) =>
            item.id === currentResumeRecordId
              ? {
                  ...item,
                  status,
                  updatedAt: Date.now(),
                  draft: cloneDraft(resumeDraft),
                  diagnosis:
                    options?.diagnosis !== undefined ? options.diagnosis : item.diagnosis,
                  optimization:
                    options?.optimization !== undefined ? options.optimization : item.optimization,
                  diagnosisActions:
                    options?.diagnosisActions !== undefined
                      ? options.diagnosisActions
                      : item.diagnosisActions,
                  quickSupplementAnswers:
                    options?.quickSupplementAnswers !== undefined
                      ? options.quickSupplementAnswers
                      : item.quickSupplementAnswers,
                  lastError: options?.error ?? null
                }
              : item
          )
          .sort((a, b) => b.updatedAt - a.updatedAt)
      );
    },
    [currentResumeRecordId, resumeDraft]
  );

  const updateResumeDraft = useCallback((patch: Partial<ResumeDraft>) => {
    setCurrentResumeRecordId(null);
    setResumeDraft((current) => ({
      ...current,
      ...patch
    }));
    setResumeDiagnosisState(null);
    setResumeDiagnosisActionsState([]);
    setResumeQuickSupplementAnswersState({});
    setResumeDiagnosisStatusState("idle");
    setResumeDiagnosisError(null);
    setResumeOptimizationState(null);
    setResumeOptimizationStatusState("idle");
    setResumeOptimizationError(null);
  }, []);

  const setResumeExtraction = useCallback((extraction: ResumeExtraction) => {
    setCurrentResumeRecordId(null);
    setResumeDraft((current) => ({
      ...current,
      extractedResume: extraction
    }));
    setResumeDiagnosisState(null);
    setResumeDiagnosisActionsState([]);
    setResumeQuickSupplementAnswersState({});
    setResumeDiagnosisStatusState("idle");
    setResumeDiagnosisError(null);
    setResumeOptimizationState(null);
    setResumeOptimizationStatusState("idle");
    setResumeOptimizationError(null);
  }, []);

  const setProjectMaterials = useCallback((materials: ResumeExtraction) => {
    setCurrentResumeRecordId(null);
    setResumeDraft((current) => ({
      ...current,
      projectMaterials: materials
    }));
    setResumeDiagnosisState(null);
    setResumeDiagnosisActionsState([]);
    setResumeDiagnosisStatusState("idle");
    setResumeDiagnosisError(null);
    setResumeOptimizationState(null);
    setResumeOptimizationStatusState("idle");
    setResumeOptimizationError(null);
  }, []);

  const setResumeDiagnosis = useCallback((result: ResumeDiagnosisResult) => {
    const now = Date.now();
    const recordId = currentResumeRecordId ?? `resume-${now}`;
    const title = resumeDraft.jobTitle.trim() || "历史记录";
    const nextRecord: ResumeFlowRecord = {
      id: recordId,
      type: "resume",
      jobTitle: resumeDraft.jobTitle.trim(),
      title,
      timestamp: formatTimestamp(new Date(now)),
      updatedAt: now,
      status: "diagnosed",
      draft: cloneDraft(resumeDraft),
      diagnosis: result,
      diagnosisActions: currentResumeRecordId
        ? resumeRecords.find((item) => item.id === recordId)?.diagnosisActions || []
        : [],
      quickSupplementAnswers: currentResumeRecordId
        ? resumeRecords.find((item) => item.id === recordId)?.quickSupplementAnswers || {}
        : {},
      optimization: null,
      lastError: null
    };

    upsertResumeRecord(nextRecord);
    setCurrentResumeRecordId(recordId);
    setResumeDiagnosisState(result);
    setResumeDiagnosisStatusState("completed");
    setResumeDiagnosisError(null);
  }, [currentResumeRecordId, resumeDraft, resumeRecords, upsertResumeRecord]);

  const setResumeDiagnosisActions = useCallback((actions: ResumeDiagnosisActionInput[]) => {
    setResumeDiagnosisActionsState(actions);
    if (!currentResumeRecordId) {
      return;
    }

    setResumeRecords((current) =>
      current.map((item) =>
        item.id === currentResumeRecordId
          ? {
              ...item,
              diagnosisActions: actions,
              updatedAt: Date.now()
            }
          : item
      )
    );
  }, [currentResumeRecordId]);

  const setResumeQuickSupplementAnswers = useCallback((answers: Record<string, string>) => {
    setResumeQuickSupplementAnswersState(answers);
    if (!currentResumeRecordId) {
      return;
    }

    setResumeRecords((current) =>
      current.map((item) =>
        item.id === currentResumeRecordId
          ? {
              ...item,
              quickSupplementAnswers: answers,
              updatedAt: Date.now()
            }
          : item
      )
    );
  }, [currentResumeRecordId]);

  const setResumeDiagnosisStatus = useCallback(
    (status: ResumeOptimizationStatus, error?: string | null) => {
      setResumeDiagnosisStatusState(status);
      setResumeDiagnosisError(error ?? null);
      if (status !== "completed") {
        setResumeDiagnosisState(null);
        setResumeDiagnosisActionsState([]);
        setResumeQuickSupplementAnswersState({});
      }
    },
    []
  );

  const setResumeOptimization = useCallback((result: ResumeOptimizationResult) => {
    const now = Date.now();
    const recordId = currentResumeRecordId ?? `resume-${now}`;
    const existingRecord = resumeRecords.find((item) => item.id === recordId);
    const title = resumeDraft.jobTitle.trim() || existingRecord?.title || "历史记录";
    const nextRecord: ResumeFlowRecord = {
      id: recordId,
      type: "resume",
      jobTitle: resumeDraft.jobTitle.trim() || existingRecord?.jobTitle || "",
      title,
      timestamp: existingRecord?.timestamp || formatTimestamp(new Date(now)),
      updatedAt: now,
      status: "optimized",
      draft: cloneDraft(resumeDraft),
      diagnosis:
        existingRecord?.diagnosis || resumeDiagnosis || ({
          jobProfile: result.jobProfile,
          resumeProfile: result.optimizedResumeProfile,
          diagnosisScores: result.beforeScores,
          summary: "",
          rawModelOutput: ""
        } as ResumeDiagnosisResult),
      diagnosisActions: resumeDiagnosisActions || existingRecord?.diagnosisActions || [],
      quickSupplementAnswers:
        Object.keys(resumeQuickSupplementAnswers).length > 0
          ? resumeQuickSupplementAnswers
          : existingRecord?.quickSupplementAnswers || {},
      optimization: result,
      lastError: null
    };

    upsertResumeRecord(nextRecord);
    setCurrentResumeRecordId(recordId);
    setResumeOptimizationState(result);
    setResumeOptimizationStatusState("completed");
    setResumeOptimizationError(null);
  }, [
    currentResumeRecordId,
    resumeDiagnosis,
    resumeDiagnosisActions,
    resumeQuickSupplementAnswers,
    resumeDraft,
    resumeRecords,
    upsertResumeRecord
  ]);

  const setResumeOptimizationStatus = useCallback(
    (status: ResumeOptimizationStatus, error?: string | null) => {
      setResumeOptimizationStatusState(status);
      setResumeOptimizationError(error ?? null);
      if (status !== "completed") {
        setResumeOptimizationState(null);
      }
    },
    []
  );

  const clearResumeOptimization = useCallback(() => {
    setResumeOptimizationState(null);
    setResumeOptimizationStatusState("idle");
    setResumeOptimizationError(null);
  }, []);

  const clearResumeDiagnosis = useCallback(() => {
    setResumeDiagnosisState(null);
    setResumeDiagnosisActionsState([]);
    setResumeQuickSupplementAnswersState({});
    setResumeDiagnosisStatusState("idle");
    setResumeDiagnosisError(null);
  }, []);

  const clearResumeDraft = useCallback(() => {
    setCurrentResumeRecordId(null);
    setResumeDraft(defaultResumeDraft);
    clearResumeDiagnosis();
    clearResumeOptimization();
  }, [clearResumeDiagnosis, clearResumeOptimization]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenIds));
  }, [hiddenIds, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(RESUME_RECORDS_KEY, JSON.stringify(resumeRecords));
  }, [isHydrated, resumeRecords]);

  const visibleRecords = useMemo(
    () => staticRecords.filter((item) => !hiddenIds.includes(item.id)),
    [hiddenIds]
  );

  const restoreResumeRecord = useCallback((id: string) => {
    const record = resumeRecords.find((item) => item.id === id);
    if (!record) {
      return false;
    }

    setCurrentResumeRecordId(record.id);
    setResumeDraft(cloneDraft(record.draft));
    setResumeDiagnosisState(record.diagnosis);
    setResumeDiagnosisActionsState(record.diagnosisActions);
    setResumeQuickSupplementAnswersState(record.quickSupplementAnswers || {});
    setResumeDiagnosisStatusState(
      record.status === "uploaded" || record.status === "diagnosing"
        ? "running"
        : record.status === "diagnose_failed"
          ? "failed"
          : record.diagnosis
            ? "completed"
            : "idle"
    );
    setResumeDiagnosisError(
      record.status === "diagnose_failed" ? record.lastError || "诊断失败，请重试。" : null
    );
    setResumeOptimizationState(record.optimization);
    setResumeOptimizationStatusState(
      record.status === "optimizing"
        ? "running"
        : record.status === "optimize_failed"
          ? "failed"
          : record.optimization
            ? "completed"
            : "idle"
    );
    setResumeOptimizationError(
      record.status === "optimize_failed" ? record.lastError || "优化失败，请重试。" : null
    );
    return true;
  }, [resumeRecords]);

  const value = useMemo<PrototypeStoreValue>(
    () => ({
      isHydrated,
      currentResumeRecordId,
      records: visibleRecords,
      resumeRecords,
      resumeDraft,
      resumeDiagnosis,
      resumeDiagnosisActions,
      resumeQuickSupplementAnswers,
      resumeDiagnosisStatus,
      resumeDiagnosisError,
      resumeOptimization,
      resumeOptimizationStatus,
      resumeOptimizationError,
      deleteRecord,
      getRecord: (id) => visibleRecords.find((item) => item.id === id),
      getResumeRecord: (id) => resumeRecords.find((item) => item.id === id),
      getRecordsByType: (type) =>
        type === "resume"
          ? resumeRecords
              .slice()
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map(buildResumeRecordItem)
          : visibleRecords.filter((item) => item.type === type),
      restoreResumeRecord,
      ensureResumeRecord,
      updateResumeRecordStatus,
      updateResumeDraft,
      setResumeExtraction,
      setProjectMaterials,
      setResumeDiagnosis,
      setResumeDiagnosisActions,
      setResumeQuickSupplementAnswers,
      setResumeDiagnosisStatus,
      setResumeOptimization,
      setResumeOptimizationStatus,
      clearResumeDiagnosis,
      clearResumeOptimization,
      clearResumeDraft
    }),
    [
      clearResumeDiagnosis,
      clearResumeOptimization,
      clearResumeDraft,
      deleteRecord,
      ensureResumeRecord,
      restoreResumeRecord,
      resumeRecords,
      resumeDraft,
      resumeDiagnosis,
      resumeDiagnosisActions,
      resumeQuickSupplementAnswers,
      resumeDiagnosisError,
      resumeDiagnosisStatus,
      resumeOptimization,
      resumeOptimizationError,
      resumeOptimizationStatus,
      setResumeExtraction,
      setProjectMaterials,
      setResumeDiagnosis,
      setResumeDiagnosisActions,
      setResumeQuickSupplementAnswers,
      setResumeDiagnosisStatus,
      setResumeOptimization,
      setResumeOptimizationStatus,
      updateResumeRecordStatus,
      updateResumeDraft,
      visibleRecords
    ]
  );

  return (
    <PrototypeStoreToastProvider>
      <PrototypeStore.Provider value={value}>{children}</PrototypeStore.Provider>
    </PrototypeStoreToastProvider>
  );
}

export function usePrototypeStore() {
  const value = useContext(PrototypeStore);

  if (!value) {
    throw new Error("usePrototypeStore must be used inside PrototypeStoreProvider");
  }

  return value;
}

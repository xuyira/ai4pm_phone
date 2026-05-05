"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  sourceDimensions: string[];
  relatedRequirement: string;
};

export type ResumeJdResumeEvidenceItem = {
  requirement: string;
  requirementType: "必需项" | "核心职责" | "加分项" | "隐形信号";
  resumeEvidence: string;
  matchType: "strong" | "partial" | "transferable" | "missing" | "unsupported";
  gap: string;
  supplementDirection: string;
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

export type ResumeOptimizationFinalSummary = {
  strengths: string[];
  gaps: string[];
  applicationLevel: "较强" | "中等偏上" | "中等" | "较弱";
  encouragement: string;
};

export type ResumeProfileBasicInfo = {
  name: string;
  gender: string;
  age: string;
  phone: string;
  email: string;
};

export type ResumeProfileJobIntent = {
  targetRole: string;
  targetCity: string;
  earliestStartDate: string;
  internshipDuration: string;
  weeklyAvailability: string;
};

export type ResumeProfileEducationItem = {
  degree: string;
  school: string;
  college: string;
  startDate: string;
  endDate: string;
  major: string;
  gpa: string;
  description: string;
};

export type ResumeProfileWorkItem = {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string[];
};

export type ResumeProfileProjectItem = {
  projectName: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string[];
};

export type ResumeProfileAchievementItem = {
  type: string;
  name: string;
  date: string;
  description: string;
};

export type ResumeProfileSkills = {
  languages: string[];
  tools: string[];
  productSkills: string[];
  technicalSkills: string[];
  aiSkills: string[];
  certificates: string[];
};

export type ResumeProfile = {
  basicInfo: ResumeProfileBasicInfo;
  jobIntent: ResumeProfileJobIntent;
  education: ResumeProfileEducationItem[];
  workExperience: ResumeProfileWorkItem[];
  projectExperience: ResumeProfileProjectItem[];
  achievements: ResumeProfileAchievementItem[];
  skills: ResumeProfileSkills;
};

export type ResumeDiagnosisResult = {
  jobProfile: {
    roleTitle: string;
    roleType: string;
    industryScenario: string[];
    coreResponsibilities: string[];
    requiredCapabilities: string[];
    preferredCapabilities: string[];
    toolsAndKeywords: string[];
    hiddenSignals: string[];
  };
  jdResumeEvidenceMatrix: ResumeJdResumeEvidenceItem[];
  quickSupplementQuestions: ResumeQuickSupplementQuestion[];
  diagnosisScores: ResumeDiagnosisScores;
  summary: string;
  rawModelOutput: string;
};

export type ResumeOptimizationResult = {
  jobProfile: ResumeDiagnosisResult["jobProfile"];
  jdResumeEvidenceMatrix: ResumeJdResumeEvidenceItem[];
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

export function getResumeRecordTimelineLevel(record?: ResumeFlowRecord | null) {
  switch (record?.status) {
    case "diagnosing":
    case "diagnosed":
    case "diagnose_failed":
      return 1;
    case "optimizing":
    case "optimized":
    case "optimize_failed":
      return 2;
    default:
      return 0;
  }
}

export function getResumeRecordStepTarget(
  record: ResumeFlowRecord | undefined,
  index: number
): "upload" | "diagnosis-loading" | "diagnosis-result" | "optimization-loading" | "optimization-result" | null {
  if (!record) {
    return index === 0 ? "upload" : null;
  }

  if (index === 0) {
    return "upload";
  }

  if (index === 1) {
    if (record.status === "diagnosing" || record.status === "diagnose_failed") {
      return "diagnosis-loading";
    }

    return "diagnosis-result";
  }

  if (index === 2) {
    if (record.status === "optimizing" || record.status === "optimize_failed") {
      return "optimization-loading";
    }

    return "optimization-result";
  }

  return null;
}

export function getResumeRecordStepStates(
  record?: ResumeFlowRecord | null,
  fallbackActive = 0
): Array<"pending" | "current" | "done"> {
  if (!record) {
    return [0, 1, 2].map((index) => (index === fallbackActive ? "current" : "pending"));
  }

  switch (record.status) {
    case "diagnosing":
    case "diagnosed":
    case "diagnose_failed":
      return ["done", "current", "pending"];
    case "optimizing":
    case "optimize_failed":
      return ["done", "done", "current"];
    case "optimized":
      return ["done", "done", "done"];
    default:
      return ["current", "pending", "pending"];
  }
}

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
  createResumeRewriteRecord: (sourceRecordId: string, mode: "upload" | "diagnosis") => string | null;
  createResumeIterationRecord: (sourceRecordId: string) => string | null;
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
  setResumeDiagnosisActionsForRecord: (
    recordId: string,
    actions: ResumeDiagnosisActionInput[]
  ) => void;
  setResumeQuickSupplementAnswersForRecord: (
    recordId: string,
    answers: Record<string, string>
  ) => void;
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

function cloneJsonValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function shouldKeepDraftBoundRecord(status?: ResumeRecordStatus) {
  return status === "uploaded" || status === "diagnosing" || status === "diagnose_failed";
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
  const [hasLoadedResumeRecords, setHasLoadedResumeRecords] = useState(false);
  const lastSyncedResumeRecordsRef = useRef<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(HIDDEN_KEY);
    if (saved) {
      setHiddenIds(JSON.parse(saved) as string[]);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/resume-records", {
      cache: "no-store"
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          records?: ResumeFlowRecord[];
        };

        if (!response.ok) {
          throw new Error("加载共享记录失败");
        }

        if (cancelled) {
          return;
        }

        const savedResumeRecords = window.localStorage.getItem(RESUME_RECORDS_KEY);
        const localRecords = savedResumeRecords
          ? (JSON.parse(savedResumeRecords) as ResumeFlowRecord[])
          : [];
        const mergedRecords = normalizeResumeRecords([...(payload.records || []), ...localRecords]);

        lastSyncedResumeRecordsRef.current = JSON.stringify(mergedRecords);
        setResumeRecords(mergedRecords);
        setHasLoadedResumeRecords(true);
      })
      .catch(() => {
        const savedResumeRecords = window.localStorage.getItem(RESUME_RECORDS_KEY);
        if (savedResumeRecords && !cancelled) {
          const parsed = JSON.parse(savedResumeRecords) as ResumeFlowRecord[];
          setResumeRecords(normalizeResumeRecords(parsed));
        }

        if (!cancelled) {
          setHasLoadedResumeRecords(true);
        }
      });

    return () => {
      cancelled = true;
    };
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
    const existingRecord = currentResumeRecordId
      ? resumeRecords.find((item) => item.id === currentResumeRecordId)
      : undefined;
    const shouldKeepRecord = shouldKeepDraftBoundRecord(existingRecord?.status);
    const nextDraft = {
      ...resumeDraft,
      ...patch
    };

    if (!shouldKeepRecord) {
      setCurrentResumeRecordId(null);
    }

    setResumeDraft(nextDraft);
    if (existingRecord && shouldKeepRecord) {
      upsertResumeRecord({
        ...existingRecord,
        status: "uploaded",
        updatedAt: Date.now(),
        jobTitle: nextDraft.jobTitle.trim() || existingRecord.jobTitle,
        title: nextDraft.jobTitle.trim() || existingRecord.title || "历史记录",
        draft: cloneDraft(nextDraft),
        diagnosis: null,
        diagnosisActions: [],
        quickSupplementAnswers: {},
        optimization: null,
        lastError: null
      });
    }
    setResumeDiagnosisState(null);
    setResumeDiagnosisActionsState([]);
    setResumeQuickSupplementAnswersState({});
    setResumeDiagnosisStatusState("idle");
    setResumeDiagnosisError(null);
    setResumeOptimizationState(null);
    setResumeOptimizationStatusState("idle");
    setResumeOptimizationError(null);
  }, [currentResumeRecordId, resumeDraft, resumeRecords, upsertResumeRecord]);

  const setResumeExtraction = useCallback((extraction: ResumeExtraction) => {
    const existingRecord = currentResumeRecordId
      ? resumeRecords.find((item) => item.id === currentResumeRecordId)
      : undefined;
    const shouldKeepRecord = shouldKeepDraftBoundRecord(existingRecord?.status);
    const nextDraft = {
      ...resumeDraft,
      extractedResume: extraction
    };

    if (!shouldKeepRecord) {
      setCurrentResumeRecordId(null);
    }
    setResumeDraft(nextDraft);
    if (existingRecord && shouldKeepRecord) {
      upsertResumeRecord({
        ...existingRecord,
        status: "uploaded",
        updatedAt: Date.now(),
        jobTitle: nextDraft.jobTitle.trim() || existingRecord.jobTitle,
        title: nextDraft.jobTitle.trim() || existingRecord.title || "历史记录",
        draft: cloneDraft(nextDraft),
        diagnosis: null,
        diagnosisActions: [],
        quickSupplementAnswers: {},
        optimization: null,
        lastError: null
      });
    }
    setResumeDiagnosisState(null);
    setResumeDiagnosisActionsState([]);
    setResumeQuickSupplementAnswersState({});
    setResumeDiagnosisStatusState("idle");
    setResumeDiagnosisError(null);
    setResumeOptimizationState(null);
    setResumeOptimizationStatusState("idle");
    setResumeOptimizationError(null);
  }, [currentResumeRecordId, resumeDraft, resumeRecords, upsertResumeRecord]);

  const setProjectMaterials = useCallback((materials: ResumeExtraction) => {
    const existingRecord = currentResumeRecordId
      ? resumeRecords.find((item) => item.id === currentResumeRecordId)
      : undefined;
    const shouldKeepRecord = shouldKeepDraftBoundRecord(existingRecord?.status);
    const nextDraft = {
      ...resumeDraft,
      projectMaterials: materials
    };

    if (!shouldKeepRecord) {
      setCurrentResumeRecordId(null);
    }

    setResumeDraft(nextDraft);
    if (existingRecord && shouldKeepRecord) {
      upsertResumeRecord({
        ...existingRecord,
        status: "uploaded",
        updatedAt: Date.now(),
        draft: cloneDraft(nextDraft),
        diagnosis: null,
        diagnosisActions: [],
        quickSupplementAnswers: {},
        optimization: null,
        lastError: null
      });
    }
    setResumeDiagnosisState(null);
    setResumeDiagnosisActionsState([]);
    setResumeDiagnosisStatusState("idle");
    setResumeDiagnosisError(null);
    setResumeOptimizationState(null);
    setResumeOptimizationStatusState("idle");
    setResumeOptimizationError(null);
  }, [currentResumeRecordId, resumeDraft, resumeRecords, upsertResumeRecord]);

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

  const setResumeDiagnosisActionsForRecord = useCallback(
    (recordId: string, actions: ResumeDiagnosisActionInput[]) => {
      if (currentResumeRecordId === recordId) {
        setResumeDiagnosisActionsState(actions);
      }

      setResumeRecords((current) =>
        current.map((item) =>
          item.id === recordId
            ? {
                ...item,
                diagnosisActions: actions,
                updatedAt: Date.now()
              }
            : item
        )
      );
    },
    [currentResumeRecordId]
  );

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

  const setResumeQuickSupplementAnswersForRecord = useCallback(
    (recordId: string, answers: Record<string, string>) => {
      if (currentResumeRecordId === recordId) {
        setResumeQuickSupplementAnswersState(answers);
      }

      setResumeRecords((current) =>
        current.map((item) =>
          item.id === recordId
            ? {
                ...item,
                quickSupplementAnswers: answers,
                updatedAt: Date.now()
              }
            : item
        )
      );
    },
    [currentResumeRecordId]
  );

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
          jdResumeEvidenceMatrix: result.jdResumeEvidenceMatrix,
          quickSupplementQuestions: [],
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

  useEffect(() => {
    if (!isHydrated || !hasLoadedResumeRecords) {
      return;
    }

    void fetch("/api/resume-records", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        records: resumeRecords
      })
    })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        lastSyncedResumeRecordsRef.current = JSON.stringify(resumeRecords);
      })
      .catch(() => {
        // Local storage remains as a fallback if shared sync fails.
      });
  }, [hasLoadedResumeRecords, isHydrated, resumeRecords]);

  useEffect(() => {
    if (!hasLoadedResumeRecords) {
      return;
    }

    const serializedRecords = JSON.stringify(resumeRecords);
    if (lastSyncedResumeRecordsRef.current === serializedRecords) {
      return;
    }

    lastSyncedResumeRecordsRef.current = null;
  }, [hasLoadedResumeRecords, resumeRecords]);

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
      record.status === "uploaded"
        ? "idle"
        : record.status === "diagnosing"
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

  const createResumeRewriteRecord = useCallback(
    (sourceRecordId: string, mode: "upload" | "diagnosis") => {
      const source = resumeRecords.find((item) => item.id === sourceRecordId);
      if (!source) {
        return null;
      }

      const now = Date.now();
      const nextId = `resume-${now}`;
      const nextDraft = cloneDraft(source.draft);
      const nextDiagnosis =
        mode === "diagnosis" && source.diagnosis ? cloneJsonValue(source.diagnosis) : null;
      const nextDiagnosisActions =
        mode === "diagnosis" ? cloneJsonValue(source.diagnosisActions || []) : [];
      const nextQuickAnswers =
        mode === "diagnosis" ? cloneJsonValue(source.quickSupplementAnswers || {}) : {};
      const nextRecord: ResumeFlowRecord = {
        id: nextId,
        type: "resume",
        jobTitle: source.jobTitle,
        title: source.title || "历史记录",
        timestamp: formatTimestamp(new Date(now)),
        updatedAt: now,
        status: mode === "diagnosis" ? "diagnosed" : "uploaded",
        draft: nextDraft,
        diagnosis: nextDiagnosis,
        diagnosisActions: nextDiagnosisActions,
        quickSupplementAnswers: nextQuickAnswers,
        optimization: null,
        lastError: null
      };

      upsertResumeRecord(nextRecord);
      setCurrentResumeRecordId(nextId);
      setResumeDraft(nextDraft);
      setResumeDiagnosisState(nextDiagnosis);
      setResumeDiagnosisActionsState(nextDiagnosisActions);
      setResumeQuickSupplementAnswersState(nextQuickAnswers);
      setResumeDiagnosisStatusState(mode === "diagnosis" && nextDiagnosis ? "completed" : "idle");
      setResumeDiagnosisError(null);
      setResumeOptimizationState(null);
      setResumeOptimizationStatusState("idle");
      setResumeOptimizationError(null);
      return nextId;
    },
    [resumeRecords, upsertResumeRecord]
  );

  const createResumeIterationRecord = useCallback(
    (sourceRecordId: string) => {
      const source = resumeRecords.find((item) => item.id === sourceRecordId);
      if (!source?.optimization) {
        return null;
      }

      const now = Date.now();
      const nextId = `resume-${now}`;
      const baseDraft = cloneDraft(source.draft);
      const baseFileName =
        source.draft.extractedResume?.filename?.replace(/\.(pdf|docx|txt)$/i, "") || "优化后简历";
      const nextDraft: ResumeDraft = {
        ...baseDraft,
        extractedResume: {
          filename: `${baseFileName}-优化后简历.txt`,
          fileType: "docx",
          parser: "optimized_resume_reuse",
          format: "text",
          charCount: source.optimization.optimizedResumeText.length,
          lineCount: source.optimization.optimizedResumeText.split("\n").length,
          qualityFlag: "good",
          warnings: [],
          content: source.optimization.optimizedResumeText
        }
      };
      const nextRecord: ResumeFlowRecord = {
        id: nextId,
        type: "resume",
        jobTitle: source.jobTitle,
        title: source.title || "历史记录",
        timestamp: formatTimestamp(new Date(now)),
        updatedAt: now,
        status: "uploaded",
        draft: nextDraft,
        diagnosis: null,
        diagnosisActions: [],
        quickSupplementAnswers: {},
        optimization: null,
        lastError: null
      };

      upsertResumeRecord(nextRecord);
      setCurrentResumeRecordId(nextId);
      setResumeDraft(nextDraft);
      setResumeDiagnosisState(null);
      setResumeDiagnosisActionsState([]);
      setResumeQuickSupplementAnswersState({});
      setResumeDiagnosisStatusState("idle");
      setResumeDiagnosisError(null);
      setResumeOptimizationState(null);
      setResumeOptimizationStatusState("idle");
      setResumeOptimizationError(null);
      return nextId;
    },
    [resumeRecords, upsertResumeRecord]
  );

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
              .filter((item) => item.status !== "uploaded")
              .slice()
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map(buildResumeRecordItem)
          : visibleRecords.filter((item) => item.type === type),
      restoreResumeRecord,
      createResumeRewriteRecord,
      createResumeIterationRecord,
      ensureResumeRecord,
      updateResumeRecordStatus,
      updateResumeDraft,
      setResumeExtraction,
      setProjectMaterials,
      setResumeDiagnosis,
      setResumeDiagnosisActions,
      setResumeQuickSupplementAnswers,
      setResumeDiagnosisActionsForRecord,
      setResumeQuickSupplementAnswersForRecord,
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
      createResumeRewriteRecord,
      createResumeIterationRecord,
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

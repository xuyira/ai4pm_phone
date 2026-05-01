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
import { records, type FeatureType, type RecordItem } from "@/lib/prototype-data";

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
  optimizedResumeText: string;
  optimizedResumeMarkdown: string;
  optimizedResumeDoc: ResumeStructuredDocument;
  jobKeywords: string[];
  baselineFindings: ResumeBaselineFinding[];
  rewritePriorities: ResumeRewritePriority[];
  keywordGapAnalysis: ResumeKeywordGapItem[];
  gapAnalysis: ResumeGapAnalysis;
  coverLetterTalkingPoints: string[];
  changeLog: string[];
  riskNotes: string[];
  beforeScores: ResumeScoreSummary;
  afterScores: ResumeScoreSummary;
  overallDelta: number;
  summary: string;
};

export type ResumeOptimizationStatus = "idle" | "running" | "completed" | "failed";

type PrototypeStoreValue = {
  records: RecordItem[];
  resumeDraft: ResumeDraft;
  resumeOptimization: ResumeOptimizationResult | null;
  resumeOptimizationStatus: ResumeOptimizationStatus;
  resumeOptimizationError: string | null;
  deleteRecord: (id: string) => void;
  getRecord: (id: string) => RecordItem | undefined;
  getRecordsByType: (type: FeatureType) => RecordItem[];
  updateResumeDraft: (patch: Partial<ResumeDraft>) => void;
  setResumeExtraction: (extraction: ResumeExtraction) => void;
  setResumeOptimization: (result: ResumeOptimizationResult) => void;
  setResumeOptimizationStatus: (
    status: ResumeOptimizationStatus,
    error?: string | null
  ) => void;
  clearResumeOptimization: () => void;
  clearResumeDraft: () => void;
};

const HIDDEN_KEY = "ai4pm-hidden-records";
const defaultResumeDraft: ResumeDraft = {
  jobTitle: "",
  jobType: "intern",
  jobDescription: "",
  notes: "",
  extractedResume: null
};
const PrototypeStore = createContext<PrototypeStoreValue | null>(null);

export function PrototypeStoreProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [resumeDraft, setResumeDraft] = useState<ResumeDraft>(defaultResumeDraft);
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

    setIsHydrated(true);
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setHiddenIds((current) => {
      return current.includes(id) ? current : [...current, id];
    });
  }, []);

  const updateResumeDraft = useCallback((patch: Partial<ResumeDraft>) => {
    setResumeDraft((current) => ({
      ...current,
      ...patch
    }));
    setResumeOptimizationState(null);
    setResumeOptimizationStatusState("idle");
    setResumeOptimizationError(null);
  }, []);

  const setResumeExtraction = useCallback((extraction: ResumeExtraction) => {
    setResumeDraft((current) => ({
      ...current,
      extractedResume: extraction
    }));
    setResumeOptimizationState(null);
    setResumeOptimizationStatusState("idle");
    setResumeOptimizationError(null);
  }, []);

  const setResumeOptimization = useCallback((result: ResumeOptimizationResult) => {
    setResumeOptimizationState(result);
    setResumeOptimizationStatusState("completed");
    setResumeOptimizationError(null);
  }, []);

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

  const clearResumeDraft = useCallback(() => {
    setResumeDraft(defaultResumeDraft);
    clearResumeOptimization();
  }, [clearResumeOptimization]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenIds));
  }, [hiddenIds, isHydrated]);

  const visibleRecords = useMemo(
    () => records.filter((item) => !hiddenIds.includes(item.id)),
    [hiddenIds]
  );

  const value = useMemo<PrototypeStoreValue>(
    () => ({
      records: visibleRecords,
      resumeDraft,
      resumeOptimization,
      resumeOptimizationStatus,
      resumeOptimizationError,
      deleteRecord,
      getRecord: (id) => visibleRecords.find((item) => item.id === id),
      getRecordsByType: (type) => visibleRecords.filter((item) => item.type === type),
      updateResumeDraft,
      setResumeExtraction,
      setResumeOptimization,
      setResumeOptimizationStatus,
      clearResumeOptimization,
      clearResumeDraft
    }),
    [
      clearResumeOptimization,
      clearResumeDraft,
      deleteRecord,
      resumeDraft,
      resumeOptimization,
      resumeOptimizationError,
      resumeOptimizationStatus,
      setResumeExtraction,
      setResumeOptimization,
      setResumeOptimizationStatus,
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

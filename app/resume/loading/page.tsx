"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  type ResumeOptimizationResult,
  getResumeRecordStepStates,
  getResumeRecordStepTarget,
  getResumeRecordTimelineLevel,
  usePrototypeStore
} from "@/components/prototype-store";
import { useToast } from "@/components/toast";
import { StepStrip } from "@/components/ui";
import { ExpandableInfoBox } from "@/components/interactive";

function ResumeLoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const readonly = searchParams.get("readonly") === "1";
  const isEditMode = searchParams.get("edit") === "1";
  const recordId = searchParams.get("recordId");
  const [resumeExpanded, setResumeExpanded] = useState(false);
  const [jobExpanded, setJobExpanded] = useState(false);
  const {
    currentResumeRecordId,
    ensureResumeRecord,
    getResumeRecord,
    resumeDraft,
    resumeDiagnosis,
    resumeDiagnosisActions,
    resumeQuickSupplementAnswers,
    resumeOptimization,
    resumeOptimizationStatus,
    setResumeOptimization,
    setResumeOptimizationStatus,
    updateResumeRecordStatus
  } = usePrototypeStore();
  const hasStarted = useRef(false);
  const isActive = useRef(true);
  const activeRecordId = recordId ?? currentResumeRecordId;
  const record = activeRecordId ? getResumeRecord(activeRecordId) : undefined;
  const pageDraft = record?.draft ?? resumeDraft;
  const timelineLevel = getResumeRecordTimelineLevel(record);
  const canViewUpload = timelineLevel >= 0;
  const canViewDiagnosis = timelineLevel >= 1;
  const canViewOptimization = timelineLevel >= 2;

  useEffect(() => {
    isActive.current = true;
    return () => {
      isActive.current = false;
    };
  }, []);

  useEffect(() => {
    if (readonly && recordId && !record) {
      router.replace("/profile/records/resume");
    }
  }, [readonly, recordId, record, router]);

  useEffect(() => {
    if (readonly) {
      return;
    }

    if (resumeOptimization) {
      if (isActive.current) {
        router.replace("/resume/result");
      }
      return;
    }

    if (hasStarted.current || resumeOptimizationStatus === "running") {
      return;
    }

    if (!resumeDiagnosis) {
      push("缺少第二节点的诊断结果，已返回诊断页。");
      router.replace("/resume/diagnosis-result");
      return;
    }

    hasStarted.current = true;
    ensureResumeRecord("optimizing");
    updateResumeRecordStatus("optimizing");
    setResumeOptimizationStatus("running");

    void fetch("/api/resume/optimize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jobProfile: resumeDiagnosis.jobProfile,
        jdResumeEvidenceMatrix: resumeDiagnosis.jdResumeEvidenceMatrix,
        originalJobDescription: resumeDraft.jobDescription,
        originalResumeText: resumeDraft.extractedResume?.content || "",
        diagnosisScores: resumeDiagnosis.diagnosisScores,
        diagnosisActions: resumeDiagnosisActions,
        quickSupplementQuestions: resumeDiagnosis.quickSupplementQuestions,
        quickSupplementAnswers: resumeQuickSupplementAnswers,
      })
    })
      .then(async (response) => {
        const rawText = await response.text();
        let payload: { detail?: string; result?: ResumeOptimizationResult } = {};

        if (rawText) {
          try {
            payload = JSON.parse(rawText) as {
              detail?: string;
              result?: ResumeOptimizationResult;
            };
          } catch {
            payload = { detail: rawText };
          }
        }

        if (!response.ok) {
          throw new Error(payload.detail ?? "简历优化失败");
        }

        if (!payload.result) {
          throw new Error(payload.detail ?? "简历优化失败：服务端未返回结果。");
        }

        setResumeOptimization(payload.result);
        if (isActive.current) {
          router.replace("/resume/result");
        }
      })
      .catch((error: Error) => {
        updateResumeRecordStatus("optimize_failed", { error: error.message });
        setResumeOptimizationStatus("failed", error.message);
      });
  }, [
    ensureResumeRecord,
    push,
    resumeDiagnosis,
    resumeDiagnosisActions,
    resumeQuickSupplementAnswers,
    resumeOptimization,
    resumeOptimizationStatus,
    router,
    setResumeOptimization,
    setResumeOptimizationStatus,
    updateResumeRecordStatus,
    readonly
  ]);

  useEffect(() => {
    if (!readonly || !record) {
      return;
    }

    if (record.status === "optimized") {
      router.replace(`/resume/result?recordId=${record.id}&readonly=1`);
      return;
    }

    if (record.status === "diagnosed" || record.status === "diagnose_failed") {
      router.replace(`/resume/diagnosis-result?recordId=${record.id}&readonly=1`);
    }
  }, [readonly, record, router]);

  if (readonly && recordId && !record) {
    return null;
  }

  const fileName = pageDraft.extractedResume?.filename ?? "已上传简历";
  const jobTitle = pageDraft.jobTitle.trim() || "目标岗位";

  return (
    <div>
      <section className="section">
        <h1 className="section-title" style={{ textAlign: "center", whiteSpace: "nowrap" }}>
          AI简历优化
        </h1>
      </section>
      <StepStrip
        steps={["上传简历与JD", "AI简历诊断", "AI简历优化"]}
        active={2}
        onStepClick={(index) => {
          if (!activeRecordId) {
            return;
          }

          const target = getResumeRecordStepTarget(record, index);
          const modeQuery = readonly ? "&readonly=1" : isEditMode ? "&edit=1" : "&readonly=1";
          if (target === "upload") {
            router.replace(`/resume/upload?recordId=${activeRecordId}${modeQuery}`);
            return;
          }

          if (target === "diagnosis-loading") {
            router.replace(`/resume/diagnosis-loading?recordId=${activeRecordId}${modeQuery}`);
            return;
          }

          if (target === "diagnosis-result") {
            router.replace(`/resume/diagnosis-result?recordId=${activeRecordId}${modeQuery}`);
            return;
          }

          if (target === "optimization-loading") {
            router.replace(`/resume/loading?recordId=${activeRecordId}${modeQuery}`);
            return;
          }

          if (target === "optimization-result") {
            router.replace(`/resume/result?recordId=${activeRecordId}${modeQuery}`);
          }
        }}
        stepStates={getResumeRecordStepStates(record, 2)}
        isStepClickable={(index) =>
          index === 0 ? canViewUpload : index === 1 ? canViewDiagnosis : canViewOptimization
        }
      />

      <section className="section form-stack">
        <ExpandableInfoBox
          title="上传的简历"
          subtitle={fileName}
          content={pageDraft.extractedResume?.content || ""}
          isExpanded={resumeExpanded}
          onToggle={setResumeExpanded}
        />
        <ExpandableInfoBox
          title="目标岗位"
          subtitle={jobTitle}
          content={`岗位标题：${pageDraft.jobTitle}\n岗位类型：${pageDraft.jobType === "intern" ? "校招/实习" : "社招"}\n\n岗位内容：\n${pageDraft.jobDescription}\n${pageDraft.notes ? `\n其他备注：\n${pageDraft.notes}` : ""}`}
          isExpanded={jobExpanded}
          onToggle={setJobExpanded}
        />
      </section>

      <div className="card status-card section">
        <div className="loader-ring" aria-hidden />
        <div>
          <h2 className="section-title" style={{ marginBottom: 10 }}>
            {readonly ? "这条记录正在优化中..." : "AI正在优化您的简历..."}
          </h2>
          <div
            className="page-subtitle"
            style={{ marginTop: 0, wordBreak: "break-word", overflowWrap: "anywhere" }}
          >
            <div>{readonly ? "当前设备为只读查看，不会重复触发新的优化任务。" : "预计需要1~2分钟，请勿关闭或刷新当前网页"}</div>
            <div style={{ marginTop: 10 }}>
              {readonly
                ? "请稍后回到记录列表刷新查看；原设备完成后，这里也能看到同一条结果。"
                : "生成完成后，结果会自动保存到“我的记录”，后续可继续查看和操作"}
            </div>
          </div>
        </div>
        <Link href="/profile/records/resume" className="button-secondary">
          查看我的记录-AI简历优化
        </Link>
        {!readonly && resumeOptimizationStatus === "failed" ? (
          <Link href="/resume/upload" className="button-secondary">
            返回修改并重试
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default function ResumeLoadingPage() {
  return (
    <Suspense fallback={null}>
      <ResumeLoadingContent />
    </Suspense>
  );
}

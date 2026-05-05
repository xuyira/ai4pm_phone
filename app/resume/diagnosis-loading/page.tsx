"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ExpandableInfoBox } from "@/components/interactive";
import {
  type ResumeDiagnosisResult,
  getResumeRecordStepStates,
  getResumeRecordStepTarget,
  getResumeRecordTimelineLevel,
  usePrototypeStore
} from "@/components/prototype-store";
import { useToast } from "@/components/toast";
import { StepStrip } from "@/components/ui";

function ResumeDiagnosisLoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const readonly = searchParams.get("readonly") === "1";
  const recordId = searchParams.get("recordId");
  const [resumeExpanded, setResumeExpanded] = useState(false);
  const [jobExpanded, setJobExpanded] = useState(false);
  const {
    currentResumeRecordId,
    ensureResumeRecord,
    getResumeRecord,
    resumeDraft,
    resumeDiagnosis,
    resumeDiagnosisError,
    resumeDiagnosisStatus,
    setResumeDiagnosis,
    setResumeDiagnosisStatus,
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

    if (resumeDiagnosis) {
      if (isActive.current) {
        router.replace("/resume/diagnosis-result");
      }
      return;
    }

    if (hasStarted.current || resumeDiagnosisStatus === "running") {
      return;
    }

    if (!resumeDraft.extractedResume?.content.trim() || !resumeDraft.jobDescription.trim()) {
      push("缺少简历文本或 JD，已返回上传页。");
      router.replace("/resume/upload");
      return;
    }

    hasStarted.current = true;
    ensureResumeRecord("diagnosing");
    updateResumeRecordStatus("diagnosing");
    setResumeDiagnosisStatus("running");

    void fetch("/api/resume/diagnose", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jobTitle: resumeDraft.jobTitle,
        jobType: resumeDraft.jobType,
        jobDescription: resumeDraft.jobDescription,
        notes: resumeDraft.notes,
        resumeText: resumeDraft.extractedResume.content,
        projectMaterialsText: resumeDraft.projectMaterials?.content || ""
      })
    })
      .then(async (response) => {
        const rawText = await response.text();
        let payload: { detail?: string; result?: ResumeDiagnosisResult } = {};

        if (rawText) {
          try {
            payload = JSON.parse(rawText) as {
              detail?: string;
              result?: ResumeDiagnosisResult;
            };
          } catch {
            payload = { detail: rawText };
          }
        }

        if (!response.ok) {
          throw new Error(payload.detail ?? "简历诊断失败");
        }

        if (!payload.result) {
          throw new Error(payload.detail ?? "简历诊断失败：服务端未返回结果。");
        }

        setResumeDiagnosis(payload.result);
        if (isActive.current) {
          router.replace("/resume/diagnosis-result");
        }
      })
      .catch((error: Error) => {
        updateResumeRecordStatus("diagnose_failed", { error: error.message });
        setResumeDiagnosisStatus("failed", error.message);
      });
  }, [
    ensureResumeRecord,
    push,
    resumeDiagnosis,
    resumeDiagnosisStatus,
    resumeDraft.extractedResume,
    resumeDraft.jobDescription,
    resumeDraft.jobTitle,
    resumeDraft.jobType,
    resumeDraft.notes,
    router,
    setResumeDiagnosis,
    setResumeDiagnosisStatus,
    updateResumeRecordStatus,
    resumeDraft.projectMaterials,
    readonly
  ]);

  useEffect(() => {
    if (!readonly || !record) {
      return;
    }

    if (record.status === "diagnosed" || record.status === "optimized") {
      router.replace(`/resume/diagnosis-result?recordId=${record.id}&readonly=1`);
      return;
    }

    if (record.status === "optimize_failed") {
      router.replace(`/resume/result?recordId=${record.id}&readonly=1`);
    }
  }, [readonly, record, router]);

  if (readonly && recordId && !record) {
    return null;
  }

  return (
    <div>
      <section className="section">
        <h1 className="section-title" style={{ textAlign: "center", whiteSpace: "nowrap" }}>
          AI简历诊断
        </h1>
      </section>
      <StepStrip
        steps={["上传简历与JD", "AI简历诊断", "AI简历优化"]}
        active={1}
        onStepClick={(index) => {
          if (!activeRecordId || !record) {
            return;
          }

          const target = getResumeRecordStepTarget(record, index);
          if (target === "upload") {
            router.replace(`/resume/upload?recordId=${activeRecordId}&readonly=1`);
            return;
          }

          if (target === "diagnosis-loading") {
            router.replace(`/resume/diagnosis-loading?recordId=${activeRecordId}&readonly=1`);
            return;
          }

          if (target === "diagnosis-result") {
            router.replace(`/resume/diagnosis-result?recordId=${activeRecordId}&readonly=1`);
            return;
          }

          if (target === "optimization-loading") {
            router.replace(`/resume/loading?recordId=${activeRecordId}&readonly=1`);
            return;
          }

          if (target === "optimization-result") {
            router.replace(`/resume/result?recordId=${activeRecordId}&readonly=1`);
          }
        }}
        stepStates={getResumeRecordStepStates(record, 1)}
        isStepClickable={(index) =>
          index === 0 ? canViewUpload : index === 1 ? canViewDiagnosis : canViewOptimization
        }
      />

      <section className="section form-stack">
        <ExpandableInfoBox
          title="上传的简历"
          subtitle={pageDraft.extractedResume?.filename || "已上传简历"}
          content={pageDraft.extractedResume?.content || ""}
          isExpanded={resumeExpanded}
          onToggle={setResumeExpanded}
        />
        <ExpandableInfoBox
          title="目标岗位"
          subtitle={pageDraft.jobTitle || "目标岗位"}
          content={`岗位标题：${pageDraft.jobTitle}\n岗位类型：${pageDraft.jobType === "intern" ? "校招/实习" : "社招"}\n\n岗位内容：\n${pageDraft.jobDescription}\n${pageDraft.notes ? `\n其他备注：\n${pageDraft.notes}` : ""}`}
          isExpanded={jobExpanded}
          onToggle={setJobExpanded}
        />
      </section>

      <div className="card status-card section">
        <div className="loader-ring" aria-hidden />
        <div>
          <h2 className="section-title" style={{ marginBottom: 10 }}>
            AI正在诊断您的简历...
          </h2>
          <div className="page-subtitle" style={{ marginTop: 0 }}>
            <div>预计需要1~2分钟，请勿关闭或刷新当前网页</div>
            <div style={{ marginTop: 10 }}>
              生成完成后，结果会自动保存到“我的记录”，后续可继续查看和操作
            </div>
          </div>
        </div>
        <Link href="/profile/records/resume" className="button-secondary">
          查看我的记录-AI简历优化
        </Link>
        {!readonly && resumeDiagnosisStatus === "failed" ? (
          <div className="form-stack" style={{ width: "100%" }}>
            <div className="hint-banner">{resumeDiagnosisError || "诊断失败，请重试。"}</div>
            <Link href="/resume/upload" className="button-secondary">
              返回修改并重试
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ResumeDiagnosisLoadingPage() {
  return (
    <Suspense fallback={null}>
      <ResumeDiagnosisLoadingContent />
    </Suspense>
  );
}

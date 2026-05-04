"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  type ResumeOptimizationResult,
  usePrototypeStore
} from "@/components/prototype-store";
import { useToast } from "@/components/toast";
import { StepStrip } from "@/components/ui";
import { ExpandableInfoBox } from "@/components/interactive";

export default function ResumeLoadingPage() {
  const router = useRouter();
  const { push } = useToast();
  const [resumeExpanded, setResumeExpanded] = useState(false);
  const [jobExpanded, setJobExpanded] = useState(false);
  const {
    ensureResumeRecord,
    resumeDraft,
    resumeDiagnosis,
    resumeDiagnosisActions,
    resumeQuickSupplementAnswers,
    resumeOptimization,
    resumeOptimizationStatus,
    setResumeOptimization,
    setResumeOptimizationStatus,
    updateResumeRecordStatus,
    currentResumeRecordId,
    getResumeRecord
  } = usePrototypeStore();
  const hasStarted = useRef(false);
  const isActive = useRef(true);
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    isActive.current = true;
    return () => {
      isActive.current = false;
      if (pollingRef.current) {
        window.clearTimeout(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (resumeOptimization) {
      if (isActive.current) {
        router.replace("/resume/result");
      }
      return;
    }

    const activeRecord = currentResumeRecordId ? getResumeRecord(currentResumeRecordId) : undefined;
    const existingTaskId = activeRecord?.optimizationTaskId || null;

    const pollTask = (taskId: string) => {
      void fetch(`/api/resume/tasks/${taskId}`)
        .then(async (response) => {
          const payload = (await response.json()) as {
            detail?: string;
            status?: "queued" | "running" | "completed" | "failed";
            result?: ResumeOptimizationResult;
            error?: string | null;
          };

          if (!response.ok) {
            throw new Error(payload.detail ?? "优化任务状态获取失败");
          }

          if (payload.status === "completed" && payload.result) {
            setResumeOptimization(payload.result);
            if (isActive.current) {
              router.replace("/resume/result");
            }
            return;
          }

          if (payload.status === "failed") {
            const message = payload.error || "优化失败，请重试。";
            updateResumeRecordStatus("optimize_failed", {
              error: message,
              optimizationTaskId: null
            });
            setResumeOptimizationStatus("failed", message);
            return;
          }

          setResumeOptimizationStatus("running");
          pollingRef.current = window.setTimeout(() => pollTask(taskId), 2000);
        })
        .catch((error: Error) => {
          updateResumeRecordStatus("optimize_failed", {
            error: error.message,
            optimizationTaskId: null
          });
          setResumeOptimizationStatus("failed", error.message);
        });
    };

    if (existingTaskId) {
      hasStarted.current = true;
      setResumeOptimizationStatus("running");
      pollTask(existingTaskId);
      return;
    }

    if (hasStarted.current) {
      return;
    }

    if (!resumeDiagnosis) {
      push("缺少第二节点的诊断结果，已返回诊断页。");
      router.replace("/resume/diagnosis-result");
      return;
    }

    hasStarted.current = true;
    ensureResumeRecord("optimizing");
    setResumeOptimizationStatus("running");

    void fetch("/api/resume/tasks/optimize", {
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
        const payload = (await response.json()) as {
          detail?: string;
          taskId?: string;
        };

        if (!response.ok) {
          throw new Error(payload.detail ?? "简历优化失败");
        }

        if (!payload.taskId) {
          throw new Error(payload.detail ?? "简历优化任务创建失败：服务端未返回任务ID。");
        }

        updateResumeRecordStatus("optimizing", {
          optimizationTaskId: payload.taskId,
          error: null
        });
        pollTask(payload.taskId);
      })
      .catch((error: Error) => {
        updateResumeRecordStatus("optimize_failed", {
          error: error.message,
          optimizationTaskId: null
        });
        setResumeOptimizationStatus("failed", error.message);
      });
  }, [
    currentResumeRecordId,
    ensureResumeRecord,
    getResumeRecord,
    push,
    resumeDiagnosis,
    resumeDiagnosisActions,
    resumeQuickSupplementAnswers,
    resumeOptimization,
    router,
    setResumeOptimization,
    setResumeOptimizationStatus,
    updateResumeRecordStatus
  ]);

  const fileName = resumeDraft.extractedResume?.filename ?? "已上传简历";
  const jobTitle = resumeDraft.jobTitle.trim() || "目标岗位";

  return (
    <div>
      <section className="section">
        <h1 className="section-title" style={{ textAlign: "center" }}>
          AI简历优化
        </h1>
      </section>
      <StepStrip steps={["上传简历与JD", "AI简历诊断", "AI简历优化"]} active={2} />

      <section className="section form-stack">
        <ExpandableInfoBox
          title="上传的简历"
          subtitle={fileName}
          content={resumeDraft.extractedResume?.content || ""}
          isExpanded={resumeExpanded}
          onToggle={setResumeExpanded}
        />
        <ExpandableInfoBox
          title="目标岗位"
          subtitle={jobTitle}
          content={`岗位标题：${resumeDraft.jobTitle}\n岗位类型：${resumeDraft.jobType === "intern" ? "校招/实习" : "社招"}\n\n岗位内容：\n${resumeDraft.jobDescription}\n${resumeDraft.notes ? `\n其他备注：\n${resumeDraft.notes}` : ""}`}
          isExpanded={jobExpanded}
          onToggle={setJobExpanded}
        />
      </section>

      <div className="card status-card section">
        <div className="loader-ring" aria-hidden />
        <div>
          <h2 className="section-title" style={{ marginBottom: 10 }}>
            AI正在优化您的简历...
          </h2>
          <p
            className="page-subtitle"
            style={{ marginTop: 0, wordBreak: "break-word", overflowWrap: "anywhere" }}
          >
            预计需要1~2分钟
          </p>
        </div>
        <p
          className="page-subtitle"
          style={{ marginTop: 12, marginBottom: 0, wordBreak: "break-word", overflowWrap: "anywhere" }}
        >
          您可放心退出，稍后在"我的记录-AI简历优化"中查看
        </p>
        {resumeOptimizationStatus === "failed" ? (
          <Link href="/resume/upload" className="button-secondary">
            返回修改并重试
          </Link>
        ) : null}
      </div>
    </div>
  );
}

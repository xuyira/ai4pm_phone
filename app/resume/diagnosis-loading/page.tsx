"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ExpandableInfoBox } from "@/components/interactive";
import {
  type ResumeDiagnosisResult,
  usePrototypeStore
} from "@/components/prototype-store";
import { useToast } from "@/components/toast";
import { StepStrip } from "@/components/ui";

export default function ResumeDiagnosisLoadingPage() {
  const router = useRouter();
  const { push } = useToast();
  const [resumeExpanded, setResumeExpanded] = useState(false);
  const [jobExpanded, setJobExpanded] = useState(false);
  const {
    ensureResumeRecord,
    resumeDraft,
    resumeDiagnosis,
    resumeDiagnosisError,
    resumeDiagnosisStatus,
    setResumeDiagnosis,
    setResumeDiagnosisStatus,
    updateResumeRecordStatus,
    currentResumeRecordId,
    getResumeRecord
  } = usePrototypeStore();
  const hasStarted = useRef(false);
  const isActive = useRef(true);
  const pollingRef = useRef<number | null>(null);
  const transientErrorCountRef = useRef(0);

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
    if (resumeDiagnosis) {
      if (isActive.current) {
        router.replace("/resume/diagnosis-result");
      }
      return;
    }

    const activeRecord = currentResumeRecordId ? getResumeRecord(currentResumeRecordId) : undefined;
    const existingTaskId = activeRecord?.diagnosisTaskId || null;

    const pollTask = (taskId: string) => {
      void fetch(`/api/resume/tasks/${taskId}`)
        .then(async (response) => {
          transientErrorCountRef.current = 0;
          const payload = (await response.json()) as {
            detail?: string;
            status?: "queued" | "running" | "completed" | "failed";
            result?: ResumeDiagnosisResult;
            error?: string | null;
          };

          if (!response.ok) {
            throw new Error(payload.detail ?? "诊断任务状态获取失败");
          }

          if (payload.status === "completed" && payload.result) {
            setResumeDiagnosis(payload.result);
            if (isActive.current) {
              router.replace("/resume/diagnosis-result");
            }
            return;
          }

          if (payload.status === "failed") {
            const message = payload.error || "诊断失败，请重试。";
            updateResumeRecordStatus("diagnose_failed", {
              error: message,
              diagnosisTaskId: null
            });
            setResumeDiagnosisStatus("failed", message);
            return;
          }

          setResumeDiagnosisStatus("running");
          pollingRef.current = window.setTimeout(() => pollTask(taskId), 2000);
        })
        .catch((error: Error) => {
          transientErrorCountRef.current += 1;

          if (transientErrorCountRef.current >= 6) {
            updateResumeRecordStatus("diagnosing", {
              error: "网络波动，正在继续重试…",
              diagnosisTaskId: taskId
            });
          }

          setResumeDiagnosisStatus("running");
          pollingRef.current = window.setTimeout(
            () => pollTask(taskId),
            transientErrorCountRef.current >= 3 ? 4000 : 2000
          );
        });
    };

    if (existingTaskId) {
      hasStarted.current = true;
      setResumeDiagnosisStatus("running");
      pollTask(existingTaskId);
      return;
    }

    if (hasStarted.current) {
      return;
    }

    if (!resumeDraft.extractedResume?.content.trim() || !resumeDraft.jobDescription.trim()) {
      push("缺少简历文本或 JD，已返回上传页。");
      router.replace("/resume/upload");
      return;
    }

    hasStarted.current = true;
    ensureResumeRecord("diagnosing");
    setResumeDiagnosisStatus("running");

    void fetch("/api/resume/tasks/diagnose", {
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
        const payload = (await response.json()) as {
          detail?: string;
          taskId?: string;
        };

        if (!response.ok) {
          throw new Error(payload.detail ?? "简历诊断失败");
        }

        if (!payload.taskId) {
          throw new Error(payload.detail ?? "简历诊断任务创建失败：服务端未返回任务ID。");
        }

        updateResumeRecordStatus("diagnosing", {
          diagnosisTaskId: payload.taskId,
          error: null
        });
        pollTask(payload.taskId);
      })
      .catch((error: Error) => {
        updateResumeRecordStatus("diagnose_failed", {
          error: error.message,
          diagnosisTaskId: null
        });
        setResumeDiagnosisStatus("failed", error.message);
      });
  }, [
    currentResumeRecordId,
    ensureResumeRecord,
    getResumeRecord,
    push,
    resumeDiagnosis,
    resumeDraft.extractedResume,
    resumeDraft.jobDescription,
    resumeDraft.jobTitle,
    resumeDraft.jobType,
    resumeDraft.notes,
    router,
    setResumeDiagnosis,
    setResumeDiagnosisStatus,
    updateResumeRecordStatus,
    resumeDraft.projectMaterials
  ]);

  return (
    <div>
      <section className="section">
        <h1 className="section-title" style={{ textAlign: "center" }}>
          AI简历诊断
        </h1>
      </section>
      <StepStrip steps={["上传简历与JD", "AI简历诊断", "AI简历优化"]} active={1} />

      <section className="section form-stack">
        <ExpandableInfoBox
          title="上传的简历"
          subtitle={resumeDraft.extractedResume?.filename || "已上传简历"}
          content={resumeDraft.extractedResume?.content || ""}
          isExpanded={resumeExpanded}
          onToggle={setResumeExpanded}
        />
        <ExpandableInfoBox
          title="目标岗位"
          subtitle={resumeDraft.jobTitle || "目标岗位"}
          content={`岗位标题：${resumeDraft.jobTitle}\n岗位类型：${resumeDraft.jobType === "intern" ? "校招/实习" : "社招"}\n\n岗位内容：\n${resumeDraft.jobDescription}\n${resumeDraft.notes ? `\n其他备注：\n${resumeDraft.notes}` : ""}`}
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
          <p className="page-subtitle" style={{ marginTop: 0 }}>
            预计需要1~2分钟
          </p>
        </div>
        <p className="page-subtitle" style={{ marginTop: 12, marginBottom: 0 }}>
          您可放心退出，稍后在"我的记录-AI简历优化"中查看
        </p>
        {resumeDiagnosisStatus === "failed" ? (
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

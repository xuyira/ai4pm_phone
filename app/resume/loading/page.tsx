"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { usePrototypeStore } from "@/components/prototype-store";
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
    resumeQuickSupplementAnswers,
    resumeOptimization,
    resumeOptimizationStatus,
    setResumeOptimization,
    setResumeOptimizationStatus,
    updateResumeRecordStatus
  } = usePrototypeStore();
  const hasStarted = useRef(false);
  const isActive = useRef(true);

  useEffect(() => {
    isActive.current = true;
    return () => {
      isActive.current = false;
    };
  }, []);

  useEffect(() => {
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
        resumeProfile: resumeDiagnosis.resumeProfile,
        diagnosisScores: resumeDiagnosis.diagnosisScores,
        quickSupplementQuestions: resumeDiagnosis.quickSupplementQuestions,
        quickSupplementAnswers: resumeQuickSupplementAnswers,
      })
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.detail ?? "简历优化失败");
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
    resumeQuickSupplementAnswers,
    resumeOptimization,
    resumeOptimizationStatus,
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

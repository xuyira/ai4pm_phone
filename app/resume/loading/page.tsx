"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { usePrototypeStore } from "@/components/prototype-store";
import { useToast } from "@/components/toast";
import { PageIntro, StepStrip } from "@/components/ui";

export default function ResumeLoadingPage() {
  const router = useRouter();
  const { push } = useToast();
  const {
    resumeDraft,
    resumeOptimization,
    resumeOptimizationError,
    resumeOptimizationStatus,
    setResumeOptimization,
    setResumeOptimizationStatus
  } = usePrototypeStore();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (resumeOptimization) {
      router.replace("/resume/result");
      return;
    }

    if (hasStarted.current || resumeOptimizationStatus === "running") {
      return;
    }

    if (!resumeDraft.extractedResume?.content.trim() || !resumeDraft.jobDescription.trim()) {
      push("缺少简历文本或 JD，已返回上传页。");
      router.replace("/resume/upload");
      return;
    }

    hasStarted.current = true;
    setResumeOptimizationStatus("running");

    void fetch("/api/resume/optimize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jobTitle: resumeDraft.jobTitle,
        jobType: resumeDraft.jobType,
        jobDescription: resumeDraft.jobDescription,
        notes: resumeDraft.notes,
        resumeText: resumeDraft.extractedResume.content
      })
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.detail ?? "简历优化失败");
        }

        setResumeOptimization(payload.result);
        push("AI 简历优化已完成。");
        router.replace("/resume/result");
      })
      .catch((error: Error) => {
        setResumeOptimizationStatus("failed", error.message);
      });
  }, [
    push,
    resumeDraft.extractedResume,
    resumeDraft.jobDescription,
    resumeDraft.jobTitle,
    resumeDraft.jobType,
    resumeDraft.notes,
    resumeOptimization,
    resumeOptimizationStatus,
    router,
    setResumeOptimization,
    setResumeOptimizationStatus
  ]);

  const fileName = resumeDraft.extractedResume?.filename ?? "已上传简历";
  const jobTitle = resumeDraft.jobTitle.trim() || "目标岗位";

  return (
    <div>
      <PageIntro
        eyebrow="简历优化"
        title="AI 正在诊断并优化你的简历"
        subtitle={`正在基于 ${fileName} 与「${jobTitle}」JD 完成岗位解析、简历改写和优化前后评分。`}
      />
      <StepStrip steps={["上传简历与 JD", "AI 处理中", "结果页"]} active={1} />

      <div className="card status-card section">
        <div className="loader-ring" aria-hidden />
        <div>
          <h2 className="section-title" style={{ marginBottom: 10 }}>
            {resumeOptimizationStatus === "failed" ? "生成失败" : "预计 30-90 秒"}
          </h2>
          <p
            className="page-subtitle"
            style={{ marginTop: 0, wordBreak: "break-word", overflowWrap: "anywhere" }}
          >
            {resumeOptimizationStatus === "failed"
              ? resumeOptimizationError ?? "本次生成未成功，请返回上一页重试。"
              : "系统会先抽取岗位画像，再重写简历，并对优化前后分别给出双层评分。"}
          </p>
        </div>
        <div className="hint-banner">
          {resumeOptimizationStatus === "failed"
            ? "失败后不会丢失已上传的简历文本和 JD 内容。"
            : "本次生成会保留在本地草稿里，完成后可直接导出 DOCX。"}
        </div>
        {resumeOptimizationStatus === "failed" ? (
          <Link href="/resume/upload" className="button-secondary">
            返回修改并重试
          </Link>
        ) : null}
      </div>

      <div className="section" style={{ display: "flex", justifyContent: "center" }}>
        <Link href="/profile/records/resume" className="button-ghost">
          去我的 &gt; 简历优化 查看记录
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ExpandableInfoBox } from "@/components/interactive";
import { usePrototypeStore } from "@/components/prototype-store";
import { useToast } from "@/components/toast";
import { StepStrip } from "@/components/ui";

export default function ResumeDiagnosisLoadingPage() {
  const router = useRouter();
  const { push } = useToast();
  const [resumeExpanded, setResumeExpanded] = useState(false);
  const [jobExpanded, setJobExpanded] = useState(false);
  const {
    resumeDraft,
    resumeDiagnosis,
    resumeDiagnosisError,
    resumeDiagnosisStatus,
    setResumeDiagnosis,
    setResumeDiagnosisStatus
  } = usePrototypeStore();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (resumeDiagnosis) {
      router.replace("/resume/diagnosis-result");
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
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.detail ?? "简历诊断失败");
        }

        setResumeDiagnosis(payload.result);
        router.replace("/resume/diagnosis-result");
      })
      .catch((error: Error) => {
        setResumeDiagnosisStatus("failed", error.message);
      });
  }, [
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

"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FakeUploadCard, ResumeTypeSwitch } from "@/components/interactive";
import { usePrototypeStore } from "@/components/prototype-store";
import { useToast } from "@/components/toast";
import { StepStrip } from "@/components/ui";

function ResumeUploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const readonly = searchParams.get("readonly") === "1";
  const recordId = searchParams.get("recordId");
  const {
    currentResumeRecordId,
    ensureResumeRecord,
    resumeDraft,
    updateResumeDraft,
    getResumeRecord,
    createResumeRewriteRecord
  } = usePrototypeStore();
  const linkedRecord = recordId ? getResumeRecord(recordId) : undefined;
  const activeRecordId = recordId ?? currentResumeRecordId;
  const pageDraft = linkedRecord?.draft ?? resumeDraft;
  const hasDiagnosis = Boolean(linkedRecord?.diagnosis);
  const hasOptimization = Boolean(linkedRecord?.optimization);
  const isReadonlyReview = readonly || hasDiagnosis || hasOptimization;
  const progressLevel = hasOptimization ? 2 : hasDiagnosis ? 1 : 0;

  useEffect(() => {
    if (readonly && recordId && !linkedRecord) {
      router.replace("/profile/records/resume");
    }
  }, [linkedRecord, readonly, recordId, router]);

  const handleStart = () => {
    if (!resumeDraft.extractedResume?.content.trim()) {
      push("请先上传简历，并等待文本提取完成。");
      return;
    }

    if (!resumeDraft.jobDescription.trim()) {
      push("请先填写目标岗位 JD。");
      return;
    }

    ensureResumeRecord("uploaded");
    router.push("/resume/diagnosis-loading");
  };

  const handleRestartDiagnosis = () => {
    if (!activeRecordId) {
      return;
    }

    const nextId = createResumeRewriteRecord(activeRecordId, "upload");
    if (!nextId) {
      push("未找到原始记录，无法重新诊断。");
      return;
    }

    router.replace("/resume/upload");
  };

  const handleStepClick = (index: number) => {
    if (activeRecordId && (hasDiagnosis || hasOptimization)) {
      if (index === 0) {
        router.replace(`/resume/upload?recordId=${activeRecordId}&readonly=1`);
        return;
      }

      if (index === 1 && progressLevel >= 1) {
        router.replace(
          hasOptimization
            ? `/resume/diagnosis-result?recordId=${activeRecordId}&readonly=1`
            : `/resume/diagnosis-result?recordId=${activeRecordId}`
        );
        return;
      }

      if (index === 2 && progressLevel >= 2) {
        router.replace(`/resume/result?recordId=${activeRecordId}&readonly=1`);
      }
    }
  };

  if (readonly && recordId && !linkedRecord) {
    return null;
  }

  return (
    <div>
      <section className="section">
        <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 32px", alignItems: "center", gap: 8 }}>
          {isReadonlyReview && activeRecordId ? (
            <Link
              href="/profile/records/resume"
              className="button-ghost"
              style={{ textAlign: "center", padding: 0 }}
            >
              &lt;
            </Link>
          ) : (
            <span />
          )}
          <h1 className="section-title" style={{ textAlign: "center", margin: 0 }}>
            AI简历优化
          </h1>
          <span />
        </div>
      </section>
      <StepStrip
        steps={["上传简历与JD", "AI简历诊断", "AI简历优化"]}
        active={0}
        onStepClick={handleStepClick}
        isStepClickable={(index) => isReadonlyReview ? index <= progressLevel : index === 0}
      />

      <section className="section form-stack">
        <div className="resume-block">
          <div className="resume-block-head">
            <span className="resume-block-index">1</span>
            <h2 className="resume-block-title">上传简历</h2>
          </div>
          <div className="card">
            {isReadonlyReview ? (
              <div className="form-stack">
                <div className="record-subtitle">
                  文件名：{pageDraft.extractedResume?.filename || "未上传简历"}
                </div>
                <div className="record-subtitle">
                  解析状态：
                  {pageDraft.extractedResume
                    ? ` 已提取 ${pageDraft.extractedResume.charCount} 字`
                    : " 未提取"}
                </div>
                {pageDraft.extractedResume?.content ? (
                  <div
                    className="preview-sheet"
                    style={{ whiteSpace: "pre-wrap", maxHeight: 220, overflowY: "auto" }}
                  >
                    {pageDraft.extractedResume.content}
                  </div>
                ) : null}
              </div>
            ) : (
              <FakeUploadCard variant="resume" />
            )}
          </div>
        </div>

        <div className="resume-block">
          <div className="resume-block-head">
            <span className="resume-block-index">2</span>
            <h2 className="resume-block-title">填写目标岗位JD</h2>
          </div>
          <div className="card form-stack">
            <div>
              <label className="field-label">岗位标题</label>
              {isReadonlyReview ? (
                <div className="record-subtitle" style={{ marginTop: 8 }}>
                  {pageDraft.jobTitle || "未填写"}
                </div>
              ) : (
                <input
                  className="input"
                  placeholder="如：AI产品经理"
                  value={resumeDraft.jobTitle}
                  onChange={(event) => updateResumeDraft({ jobTitle: event.target.value })}
                />
              )}
            </div>

            <div>
              <label className="field-label">岗位类型</label>
              {isReadonlyReview ? (
                <div className="record-subtitle" style={{ marginTop: 8 }}>
                  {pageDraft.jobType === "intern" ? "校招/实习" : "社招"}
                </div>
              ) : (
                <ResumeTypeSwitch
                  value={resumeDraft.jobType}
                  onChange={(jobType) => updateResumeDraft({ jobType })}
                />
              )}
            </div>

            <div>
              <label className="field-label">岗位内容<span className="required">*</span></label>
              {isReadonlyReview ? (
                <div
                  className="preview-sheet"
                  style={{ marginTop: 8, whiteSpace: "pre-wrap", maxHeight: 220, overflowY: "auto" }}
                >
                  {pageDraft.jobDescription || "未填写"}
                </div>
              ) : (
                <textarea
                  className="textarea"
                  placeholder="请粘贴目标岗位的职责描述和任职要求..."
                  value={resumeDraft.jobDescription}
                  onChange={(event) => updateResumeDraft({ jobDescription: event.target.value })}
                />
              )}
            </div>

            <div>
              <label className="field-label">其他备注</label>
              {isReadonlyReview ? (
                <div
                  className="preview-sheet"
                  style={{ marginTop: 8, whiteSpace: "pre-wrap", maxHeight: 160, overflowY: "auto" }}
                >
                  {pageDraft.notes || "未填写"}
                </div>
              ) : (
                <textarea
                  className="textarea"
                  placeholder="其他需要补充的信息..."
                  value={resumeDraft.notes}
                  onChange={(event) => updateResumeDraft({ notes: event.target.value })}
                />
              )}
            </div>
          </div>
        </div>

        {isReadonlyReview ? (
          <button type="button" className="button" onClick={handleRestartDiagnosis}>
            修改文件重新诊断
          </button>
        ) : (
          <button type="button" className="button" onClick={handleStart}>
            开始AI简历诊断
          </button>
        )}
      </section>
    </div>
  );
}

export default function ResumeUploadPage() {
  return (
    <Suspense fallback={null}>
      <ResumeUploadContent />
    </Suspense>
  );
}

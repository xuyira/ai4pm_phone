"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ExpandableInfoBox } from "@/components/interactive";
import { ScoreRadar } from "@/components/resume-analytics";
import { usePrototypeStore } from "@/components/prototype-store";
import { StepStrip } from "@/components/ui";

const dimensionMeta = [
  { key: "structureClarity", label: "结构清晰度" },
  { key: "languageProfessionalism", label: "语言专业度" },
  { key: "resultQuantification", label: "指标量化度" },
  { key: "productExpression", label: "产品思维度" },
  { key: "hardRequirementFit", label: "要求达成度" },
  { key: "responsibilityCoverage", label: "职责覆盖度" },
  { key: "industryRelevance", label: "行业相关度" },
  { key: "priorityFocus", label: "重点突出度" }
] as const;
const dimensionLabelMap = Object.fromEntries(dimensionMeta.map((item) => [item.key, item.label])) as Record<string, string>;

type DimensionKey = (typeof dimensionMeta)[number]["key"];
type PriorityLevel = "high" | "medium" | "low";

const priorityMeta: Record<PriorityLevel, { label: string; className: string; order: number }> = {
  high: { label: "优先级高", className: "priority-pill-high", order: 0 },
  medium: { label: "优先级中", className: "priority-pill-medium", order: 1 },
  low: { label: "优先级低", className: "priority-pill-low", order: 2 }
};
const priorityTextMeta: Record<PriorityLevel, string> = {
  high: "高",
  medium: "中",
  low: "低"
};

function ResumeDiagnosisResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const readonly = searchParams.get("readonly") === "1";
  const recordId = searchParams.get("recordId");
  const {
    currentResumeRecordId,
    getResumeRecord,
    resumeDraft,
    resumeDiagnosis,
    resumeOptimization,
    createResumeRewriteRecord,
    resumeDiagnosisActions,
    setResumeDiagnosisActions,
    setResumeDiagnosisActionsForRecord,
    resumeQuickSupplementAnswers,
    setResumeQuickSupplementAnswers,
    setResumeQuickSupplementAnswersForRecord
  } = usePrototypeStore();
  const [resumeExpanded, setResumeExpanded] = useState(false);
  const [jobExpanded, setJobExpanded] = useState(false);
  const [quickSectionExpanded, setQuickSectionExpanded] = useState(true);
  const [detailSectionExpanded, setDetailSectionExpanded] = useState(false);
  const [quickExpanded, setQuickExpanded] = useState<Record<string, boolean>>({});
  const linkedRecord = recordId ? getResumeRecord(recordId) : undefined;
  const activeRecordId = recordId ?? currentResumeRecordId;
  const diagnosis = linkedRecord?.diagnosis ?? resumeDiagnosis;
  const pageDraft = linkedRecord?.draft ?? resumeDraft;
  const savedDiagnosisActions = linkedRecord?.diagnosisActions ?? resumeDiagnosisActions;
  const savedQuickAnswers = linkedRecord?.quickSupplementAnswers ?? resumeQuickSupplementAnswers;
  const visibleQuickQuestions = diagnosis?.quickSupplementQuestions ?? [];
  const hasOptimization = Boolean(linkedRecord?.optimization);
  const isReadonlyReview = readonly || hasOptimization;
  const progressLevel = hasOptimization ? 2 : diagnosis ? 1 : 0;

  useEffect(() => {
    if (!recordId && !readonly && resumeOptimization) {
      router.replace("/resume/result");
    }
  }, [recordId, readonly, resumeOptimization, router]);

  const totalScore = useMemo(() => {
    if (!diagnosis) {
      return 0;
    }
    const values = dimensionMeta.map((item) => diagnosis.diagnosisScores[item.key].score);
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  }, [diagnosis]);

  const radarItems = dimensionMeta.map((item) => ({
    label: item.label,
    value: diagnosis?.diagnosisScores[item.key].score ? diagnosis.diagnosisScores[item.key].score * 10 : 0
  }));

  const sortedDimensions = diagnosis
    ? [...dimensionMeta].sort((a, b) => {
        const priorityA = priorityMeta[diagnosis.diagnosisScores[a.key].priority].order;
        const priorityB = priorityMeta[diagnosis.diagnosisScores[b.key].priority].order;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        return diagnosis.diagnosisScores[b.key].score - diagnosis.diagnosisScores[a.key].score;
      })
    : dimensionMeta;

  const toggleQuick = (key: string) => {
    setQuickExpanded((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  const getDiagnosisActionComment = (dimension: string) =>
    savedDiagnosisActions.find((item) => item.dimension === dimension)?.userComment || "";

  const updateDiagnosisActionComment = (dimension: string, userComment: string) => {
    const nextActions = [...savedDiagnosisActions];
    const targetIndex = nextActions.findIndex((item) => item.dimension === dimension);

    if (targetIndex >= 0) {
      nextActions[targetIndex] = {
        ...nextActions[targetIndex],
        userComment
      };
    } else {
      nextActions.push({
        dimension,
        userComment
      });
    }

    if (activeRecordId) {
      setResumeDiagnosisActionsForRecord(activeRecordId, nextActions);
      return;
    }

    if (recordId) {
      setResumeDiagnosisActionsForRecord(recordId, nextActions);
      return;
    }

    setResumeDiagnosisActions(nextActions);
  };

  const handleStartOptimization = () => {
    if (!diagnosis) {
      return;
    }

    setResumeQuickSupplementAnswers(savedQuickAnswers);
    router.push("/resume/loading");
  };

  const handleRewriteOptimization = () => {
    if (!activeRecordId) {
      return;
    }

    const nextId = createResumeRewriteRecord(activeRecordId, "diagnosis");
    if (!nextId) {
      return;
    }

    router.replace("/resume/diagnosis-result");
  };

  const handleStepClick = (index: number) => {
    if (activeRecordId && diagnosis) {
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
      return;
    }

    if (index === 0) {
      router.push("/resume/upload");
    }
  };

  if (!diagnosis) {
    router.replace("/resume/upload");
    return null;
  }

  if (!recordId && !readonly && resumeOptimization) {
    return null;
  }

  const canViewOptimization = hasOptimization;

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
            AI简历诊断结果
          </h1>
          {canViewOptimization ? (
            <Link
              href={`/resume/result?recordId=${activeRecordId}&readonly=1`}
              className="button-ghost"
              style={{ textAlign: "center", padding: 0 }}
            >
              &gt;
            </Link>
          ) : (
            <span />
          )}
        </div>
      </section>
      <StepStrip
        steps={["上传简历与JD", "AI简历诊断", "AI简历优化"]}
        active={1}
        onStepClick={handleStepClick}
        isStepClickable={(index) => index <= progressLevel}
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

      <section className="section score-panel diagnosis-score-panel">
        <div className="score-card diagnosis-radar-card">
          <div className="diagnosis-total-score">
            <div className="muted">简历总分（满分10分）</div>
            <div className="score-big">{totalScore}</div>
          </div>
          <ScoreRadar items={radarItems} hideTitle hideLegend />
        </div>
      </section>

      <section className="section form-stack">
        <div className="card form-stack">
          <button
            type="button"
            className="diagnosis-card-toggle"
            onClick={() => setDetailSectionExpanded((current) => !current)}
          >
            <span className="record-title">8维详细建议</span>
            <span className={`diagnosis-toggle-icon${detailSectionExpanded ? " is-open" : ""}`}>▾</span>
          </button>
          {detailSectionExpanded
            ? sortedDimensions.map((item) => {
                const detail = diagnosis.diagnosisScores[item.key];
                const priority = priorityMeta[detail.priority];

                return (
                  <div key={item.key} className="soft-card">
                    <div className="diagnosis-card-toggle diagnosis-dimension-toggle">
                      <span className="record-title diagnosis-dimension-name">{item.label}</span>
                      <span className="record-subtitle diagnosis-dimension-score">{detail.score}分</span>
                      <span className={`pill ${priority.className}`}>{priority.label}</span>
                    </div>
                    <div className="form-stack" style={{ marginTop: 12 }}>
                      <div className="record-subtitle">评分理由：{detail.reason}</div>
                      <div className="record-subtitle">优化建议：{detail.improvement}</div>
                      {isReadonlyReview ? (
                        <div
                          className="record-subtitle"
                          style={{ whiteSpace: "pre-wrap", marginTop: 4 }}
                        >
                          {getDiagnosisActionComment(item.key) || "未填写"}
                        </div>
                      ) : (
                        <textarea
                          className="textarea"
                          rows={1}
                          placeholder="可填写你的意见或补充信息"
                          value={getDiagnosisActionComment(item.key)}
                          onChange={(event) =>
                            updateDiagnosisActionComment(item.key, event.target.value)
                          }
                          style={{ minHeight: 40, resize: "vertical" }}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            : null}
        </div>

        <div className="card form-stack">
          <button
            type="button"
            className="diagnosis-card-toggle"
            onClick={() => setQuickSectionExpanded((current) => !current)}
          >
            <span className="record-title">核心快速补充</span>
            <span className={`diagnosis-toggle-icon${quickSectionExpanded ? " is-open" : ""}`}>▾</span>
          </button>
          {quickSectionExpanded
            ? visibleQuickQuestions.map((question, index) => {
                const isOpen = quickExpanded[question.id];
                const savedAnswer = savedQuickAnswers[question.id] || "";
                return (
                  <div key={question.id} className="soft-card">
                    <button
                      type="button"
                      className="diagnosis-card-toggle"
                      onClick={() => toggleQuick(question.id)}
                    >
                      <span className="record-title diagnosis-question-title">
                        {index + 1}. {question.question}
                      </span>
                      <span className={`diagnosis-toggle-icon${isOpen ? " is-open" : ""}`}>▾</span>
                    </button>
                    {isOpen ? (
                      <div className="form-stack" style={{ marginTop: 12 }}>
                        <div className="record-subtitle">
                          提升维度：{question.sourceDimensions.map((key) => dimensionLabelMap[key] || key).join("、")}
                        </div>
                        <div className="record-subtitle">补充原因：{question.whyAsk}</div>
                        <div>
                          <label className="field-label">你的补充</label>
                          {isReadonlyReview ? (
                            <div className="record-subtitle" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                              {savedAnswer || "未填写"}
                            </div>
                          ) : (
                            <textarea
                              className="textarea"
                              rows={4}
                              placeholder="请直接补充这条信息，便于后续优化时使用..."
                              value={savedQuickAnswers[question.id] || ""}
                              onChange={(event) => {
                                const nextAnswers = {
                                  ...savedQuickAnswers,
                                  [question.id]: event.target.value
                                };

                                if (activeRecordId) {
                                  setResumeQuickSupplementAnswersForRecord(activeRecordId, nextAnswers);
                                  return;
                                }

                                setResumeQuickSupplementAnswers(nextAnswers);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            : null}
          {quickSectionExpanded ? (
            <div className="soft-card">
              <button
                type="button"
                className="diagnosis-card-toggle"
                onClick={() => toggleQuick("__custom")}
              >
                <span className="record-title diagnosis-question-title">自定义补充</span>
                <span className={`diagnosis-toggle-icon${quickExpanded.__custom ? " is-open" : ""}`}>▾</span>
              </button>
              {quickExpanded.__custom ? (
                <div className="form-stack" style={{ marginTop: 12 }}>
                  <div className="record-subtitle">可补充任何你希望 AI 在后续优化时重点参考的信息。</div>
                  <div>
                    <label className="field-label">你的补充</label>
                    {isReadonlyReview ? (
                      <div className="record-subtitle" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                        {savedQuickAnswers.__custom?.trim() || "未填写"}
                      </div>
                    ) : (
                      <textarea
                        className="textarea"
                        rows={4}
                        placeholder="例如：补充项目背景、真实数据、投递偏好或想强调的经历..."
                        value={savedQuickAnswers.__custom || ""}
                        onChange={(event) => {
                          const nextAnswers = {
                            ...savedQuickAnswers,
                            __custom: event.target.value
                          };

                          if (activeRecordId) {
                            setResumeQuickSupplementAnswersForRecord(activeRecordId, nextAnswers);
                            return;
                          }

                          setResumeQuickSupplementAnswers(nextAnswers);
                        }}
                      />
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {!isReadonlyReview ? (
        <section className="section">
          <button type="button" className="button" onClick={handleStartOptimization}>
            开始AI简历优化
          </button>
        </section>
      ) : (
        <section className="section form-stack">
          <button type="button" className="button" onClick={handleRewriteOptimization}>
            修改回答重新优化
          </button>
        </section>
      )}
    </div>
  );
}

export default function ResumeDiagnosisResultPage() {
  return (
    <Suspense fallback={null}>
      <ResumeDiagnosisResultContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ExpandableInfoBox } from "@/components/interactive";
import { ScoreRadar } from "@/components/resume-analytics";
import { usePrototypeStore } from "@/components/prototype-store";
import { StepStrip } from "@/components/ui";

const dimensionMeta = [
  { key: "structureClarity", label: "结构清晰度" },
  { key: "languageProfessionalism", label: "语言专业度" },
  { key: "priorityFocus", label: "重点突出度" },
  { key: "productExpression", label: "产品逻辑度" },
  { key: "resultQuantification", label: "指标量化度" },
  { key: "hardRequirementFit", label: "门槛达成度" },
  { key: "responsibilityCoverage", label: "职责覆盖度" },
  { key: "industryRelevance", label: "行业相关度" }
] as const;

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
    getResumeRecord,
    resumeDraft,
    resumeDiagnosis,
    resumeQuickSupplementAnswers,
    setResumeDiagnosisActions,
    setResumeQuickSupplementAnswers
  } = usePrototypeStore();
  const [resumeExpanded, setResumeExpanded] = useState(false);
  const [jobExpanded, setJobExpanded] = useState(false);
  const [debugExpanded, setDebugExpanded] = useState(false);
  const [quickSectionExpanded, setQuickSectionExpanded] = useState(true);
  const [detailSectionExpanded, setDetailSectionExpanded] = useState(true);
  const [quickExpanded, setQuickExpanded] = useState<Record<string, boolean>>({});
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const linkedRecord = recordId ? getResumeRecord(recordId) : undefined;
  const diagnosis = linkedRecord?.diagnosis ?? resumeDiagnosis;
  const pageDraft = linkedRecord?.draft ?? resumeDraft;
  const savedQuickAnswers = linkedRecord?.quickSupplementAnswers ?? resumeQuickSupplementAnswers;
  const [adoptionState, setAdoptionState] = useState<Record<string, "yes" | "no">>(() =>
    Object.fromEntries(dimensionMeta.map((item) => [item.key, "yes"]))
  );
  const [userComments, setUserComments] = useState<Record<string, string>>(() =>
    linkedRecord?.diagnosisActions.length
      ? Object.fromEntries(linkedRecord.diagnosisActions.map((item) => [item.dimension, item.userComment]))
      : {}
  );

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

  const toggleCard = (key: DimensionKey) => {
    setOpenCards((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  const toggleQuick = (key: string) => {
    setQuickExpanded((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  const handleStartOptimization = () => {
    if (!diagnosis) {
      return;
    }

    const supplementComment = diagnosis.quickSupplementQuestions
      .map((question) => {
        const answer = (savedQuickAnswers[question.id] || "").trim();
        return answer ? `${question.question}\n用户补充：${answer}` : "";
      })
      .filter(Boolean)
      .join("\n\n");

    setResumeQuickSupplementAnswers(savedQuickAnswers);
    setResumeDiagnosisActions(
      dimensionMeta.map((item) => ({
        dimension: item.key,
        adopted: adoptionState[item.key] === "yes",
        userComment: [userComments[item.key] || "", supplementComment].filter(Boolean).join("\n\n")
      }))
    );
    router.push("/resume/loading");
  };

  if (!diagnosis) {
    router.replace("/resume/upload");
    return null;
  }

  const readonlyActions = Object.fromEntries(
    (linkedRecord?.diagnosisActions || []).map((item) => [item.dimension, item])
  );
  const canViewOptimization = readonly && linkedRecord?.optimization;

  return (
    <div>
      <section className="section">
        <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 32px", alignItems: "center", gap: 8 }}>
          <span />
          <h1 className="section-title" style={{ textAlign: "center", margin: 0 }}>
            AI简历诊断结果
          </h1>
          {canViewOptimization ? (
            <Link
              href={`/resume/result?recordId=${recordId}&readonly=1`}
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
      <StepStrip steps={["上传简历与JD", "AI简历诊断", "AI简历优化"]} active={1} />

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
            onClick={() => setQuickSectionExpanded((current) => !current)}
          >
            <span className="record-title">快速补充</span>
            <span className={`diagnosis-toggle-icon${quickSectionExpanded ? " is-open" : ""}`}>▾</span>
          </button>
          {quickSectionExpanded
            ? diagnosis.quickSupplementQuestions.map((question, index) => {
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
                        <div className="record-subtitle">补充原因：{question.whyAsk}</div>
                        <div>
                          <label className="field-label">{readonly ? "已填写补充" : "你的补充"}</label>
                          {readonly ? (
                            <div className="record-subtitle" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                              {savedAnswer || "未填写"}
                            </div>
                          ) : (
                            <textarea
                              className="textarea"
                              rows={4}
                              placeholder="请直接补充这条信息，便于后续优化时使用..."
                              value={savedQuickAnswers[question.id] || ""}
                              onChange={(event) =>
                                setResumeQuickSupplementAnswers({
                                  ...savedQuickAnswers,
                                  [question.id]: event.target.value
                                })
                              }
                            />
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            : null}
        </div>

        <div className="card form-stack">
          <button
            type="button"
            className="diagnosis-card-toggle"
            onClick={() => setDetailSectionExpanded((current) => !current)}
          >
            <span className="record-title">详细补充</span>
            <span className={`diagnosis-toggle-icon${detailSectionExpanded ? " is-open" : ""}`}>▾</span>
          </button>
          {detailSectionExpanded
            ? sortedDimensions.map((item) => {
                const detail = diagnosis.diagnosisScores[item.key];
                const isOpen = openCards[item.key];
                const savedAction = readonlyActions[item.key];
                const priority = priorityMeta[detail.priority];

                return (
                  <div key={item.key} className="soft-card">
                    <button
                      type="button"
                      className="diagnosis-card-toggle"
                      onClick={() => toggleCard(item.key)}
                    >
                      <span className="record-title">{item.label}</span>
                      <span className="record-subtitle">{detail.score}分</span>
                      <span className={`pill ${priority.className}`}>{priority.label}</span>
                      <span className={`diagnosis-toggle-icon${isOpen ? " is-open" : ""}`}>▾</span>
                    </button>
                    {isOpen ? (
                      <div className="form-stack" style={{ marginTop: 12 }}>
                        <div className="record-subtitle">评分标准：{item.label}</div>
                        <div className="record-subtitle">分数：{detail.score}</div>
                        <div className="record-subtitle">优先级：{priorityTextMeta[detail.priority]}</div>
                        <div className="record-subtitle">评分理由：{detail.reason}</div>
                        <div className="record-subtitle">优化建议：{detail.improvement}</div>
                        {readonly ? (
                          <>
                            <div className="field-label">是否采纳</div>
                            <div className="record-subtitle">{savedAction?.adopted ? "是" : "否"}</div>
                          </>
                        ) : (
                          <>
                            <div className="field-label">是否采纳</div>
                            <div className="diagnosis-choice-row">
                              <button
                                type="button"
                                className={`chip-button${adoptionState[item.key] === "yes" ? " is-active" : ""}`}
                                onClick={() =>
                                  setAdoptionState((current) => ({
                                    ...current,
                                    [item.key]: "yes"
                                  }))
                                }
                              >
                                是
                              </button>
                              <button
                                type="button"
                                className={`chip-button${adoptionState[item.key] === "no" ? " is-active" : ""}`}
                                onClick={() =>
                                  setAdoptionState((current) => ({
                                    ...current,
                                    [item.key]: "no"
                                  }))
                                }
                              >
                                否
                              </button>
                            </div>
                          </>
                        )}
                        <div>
                          <label className="field-label">{readonly ? "已填写意见" : "你的意见"}</label>
                          {readonly ? (
                            <div className="record-subtitle" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                              {savedAction?.userComment?.trim() || "未填写"}
                            </div>
                          ) : (
                            <textarea
                              className="textarea"
                              rows={4}
                              placeholder="可补充你想强调的内容或修改要求..."
                              value={userComments[item.key] || ""}
                              onChange={(event) =>
                                setUserComments((current) => ({
                                  ...current,
                                  [item.key]: event.target.value
                                }))
                              }
                            />
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            : null}
        </div>
        <ExpandableInfoBox
          title="调试查看：诊断模型完整输出"
          subtitle="用于核对大模型返回的全部结构化结果"
          content={diagnosis.rawModelOutput}
          isExpanded={debugExpanded}
          onToggle={setDebugExpanded}
        />
      </section>

      {!readonly ? (
        <section className="section">
          <button type="button" className="button" onClick={handleStartOptimization}>
            开始简历优化
          </button>
        </section>
      ) : null}
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

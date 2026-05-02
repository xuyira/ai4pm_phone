"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExpandableInfoBox } from "@/components/interactive";
import { ScoreRadar } from "@/components/resume-analytics";
import { usePrototypeStore } from "@/components/prototype-store";
import { StepStrip } from "@/components/ui";

const dimensionMeta = [
  { key: "structureClarity", label: "结构清晰度" },
  { key: "informationCompleteness", label: "内容完整度" },
  { key: "resultQuantification", label: "结果量化度" },
  { key: "productExpression", label: "产品表达度" },
  { key: "responsibilityCoverage", label: "职责覆盖度" },
  { key: "atsKeywordMatch", label: "ATS匹配度" },
  { key: "hardRequirementFit", label: "门槛达成度" }
] as const;

type DimensionKey = (typeof dimensionMeta)[number]["key"];

export default function ResumeDiagnosisResultPage() {
  const router = useRouter();
  const { resumeDraft, resumeDiagnosis } = usePrototypeStore();
  const [resumeExpanded, setResumeExpanded] = useState(false);
  const [jobExpanded, setJobExpanded] = useState(false);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const [adoptionState, setAdoptionState] = useState<Record<string, "yes" | "no">>(() =>
    Object.fromEntries(dimensionMeta.map((item) => [item.key, "yes"]))
  );
  const [userComments, setUserComments] = useState<Record<string, string>>({});

  if (!resumeDiagnosis) {
    router.replace("/resume/upload");
    return null;
  }

  const totalScore = useMemo(() => {
    const values = dimensionMeta.map((item) => resumeDiagnosis.diagnosisScores[item.key].score);
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  }, [resumeDiagnosis]);

  const radarItems = dimensionMeta.map((item) => ({
    label: item.label,
    value: resumeDiagnosis.diagnosisScores[item.key].score * 10
  }));

  const toggleCard = (key: DimensionKey) => {
    setOpenCards((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  return (
    <div>
      <section className="section">
        <h1 className="section-title" style={{ textAlign: "center" }}>
          AI简历诊断结果
        </h1>
      </section>
      <StepStrip steps={["上传简历与 JD", "AI 简历诊断", "诊断结果"]} active={2} />

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

      <section className="section score-panel diagnosis-score-panel">
        <div className="score-card">
          <div className="muted">诊断总分</div>
          <div className="score-big">{totalScore}</div>
          <div className="record-subtitle">7维度平均分，满分 10 分</div>
        </div>
        <ScoreRadar title="7维诊断雷达图" items={radarItems} />
      </section>

      <section className="section form-stack">
        {dimensionMeta.map((item) => {
          const detail = resumeDiagnosis.diagnosisScores[item.key];
          const isOpen = openCards[item.key];

          return (
            <div key={item.key} className="soft-card">
              <button
                type="button"
                className="diagnosis-card-toggle"
                onClick={() => toggleCard(item.key)}
              >
                <span className="record-title">{item.label}</span>
                <span className="pill">{detail.score}</span>
              </button>
              {isOpen ? (
                <div className="form-stack" style={{ marginTop: 12 }}>
                  <div className="record-subtitle">评分标准：{item.label}</div>
                  <div className="record-subtitle">分数：{detail.score}</div>
                  <div className="record-subtitle">评分理由：{detail.reason}</div>
                  <div className="record-subtitle">优化建议：{detail.improvement}</div>
                  <div className="record-subtitle">是否采纳</div>
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
                  <div>
                    <label className="field-label">你的意见</label>
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
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="section">
        <button type="button" className="button" onClick={() => router.push("/resume/result")}>
          开始简历优化
        </button>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CompareScoreRadar } from "@/components/resume-analytics";
import { usePrototypeStore } from "@/components/prototype-store";
import { StepStrip } from "@/components/ui";

const dimensionMeta = [
  { key: "structureClarity", label: "结构清晰度" },
  { key: "resultQuantification", label: "结果量化度" },
  { key: "productExpression", label: "产品表达度" },
  { key: "languageProfessionalism", label: "语言专业度" },
  { key: "responsibilityCoverage", label: "职责覆盖度" },
  { key: "industryRelevance", label: "行业相关度" },
  { key: "hardRequirementFit", label: "门槛达成度" }
] as const;

export default function ResumeResultPage() {
  const router = useRouter();
  const { resumeOptimization } = usePrototypeStore();

  useEffect(() => {
    if (!resumeOptimization) {
      router.replace("/resume/upload");
    }
  }, [resumeOptimization, router]);

  if (!resumeOptimization) {
    return null;
  }

  const totalScore = useMemo(() => {
    const values = dimensionMeta.map((item) => resumeOptimization.afterScores[item.key].finalScore);
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  }, [resumeOptimization]);

  const totalDelta = useMemo(() => {
    const beforeValues = dimensionMeta.map((item) => resumeOptimization.beforeScores[item.key].score);
    const beforeAverage = beforeValues.reduce((sum, value) => sum + value, 0) / beforeValues.length;
    return Math.round((totalScore - beforeAverage) * 10) / 10;
  }, [resumeOptimization, totalScore]);

  const beforeRadar = dimensionMeta.map((item) => ({
    label: item.label,
    value: resumeOptimization.beforeScores[item.key].score * 10
  }));

  const afterRadar = dimensionMeta.map((item) => ({
    label: item.label,
    value: resumeOptimization.afterScores[item.key].finalScore * 10
  }));

  const previewLines = useMemo(() => {
    const profile = resumeOptimization.optimizedResumeProfile;
    const lines: string[] = [];

    if (profile.basicInfo.name) {
      lines.push(profile.basicInfo.name);
    }

    [profile.basicInfo.phone, profile.basicInfo.email].filter(Boolean).forEach((item) => {
      lines.push(item);
    });

    profile.education.forEach((item) => {
      lines.push(`${item.school}｜${item.degree}｜${item.major}`);
      lines.push(`${item.startDate} - ${item.endDate}`);
    });

    profile.workExperience.forEach((item) => {
      lines.push(`${item.company}｜${item.title}`);
      lines.push(`${item.startDate} - ${item.endDate}`);
      lines.push(item.description);
    });

    profile.projectExperience.forEach((item) => {
      lines.push(`${item.projectName}｜${item.role}`);
      lines.push(`${item.startDate} - ${item.endDate}`);
      lines.push(item.description);
    });

    if (profile.skills.languageTests.length) {
      lines.push(`语言：${profile.skills.languageTests.join(" / ")}`);
    }
    if (profile.skills.programmingLanguages.length) {
      lines.push(`编程：${profile.skills.programmingLanguages.join(" / ")}`);
    }
    if (profile.skills.aiSkills.length) {
      lines.push(`AI：${profile.skills.aiSkills.join(" / ")}`);
    }

    return lines.filter(Boolean);
  }, [resumeOptimization]);

  return (
    <div>
      <section className="section">
        <h1 className="section-title" style={{ textAlign: "center" }}>
          AI简历优化结果
        </h1>
      </section>
      <StepStrip steps={["上传简历与JD", "AI简历诊断", "AI简历优化"]} active={2} />

      <section className="section">
        <div className="score-card diagnosis-radar-card">
          <div className="diagnosis-total-score">
            <div className="muted">简历总分（满分10分）</div>
            <div className="score-big">{totalScore}</div>
            <div className="record-subtitle">
              优化后7维平均分，较优化前提升
              {totalDelta > 0 ? "+" : ""}
              {totalDelta}分
            </div>
          </div>
          <CompareScoreRadar beforeItems={beforeRadar} afterItems={afterRadar} hideTitle />
        </div>
      </section>

      <section className="card section form-stack">
        <div className="record-title">结构化简历</div>
        <div className="preview-sheet rich-preview">
          {previewLines.map((line, index) => (
            <div key={`${line}-${index}`} className="record-subtitle rich-preview-line">
              {line}
            </div>
          ))}
        </div>
      </section>

      <section className="section form-stack">
        <div className="card">
          <div className="record-title">优势项</div>
          <div className="form-stack" style={{ marginTop: 12 }}>
            {resumeOptimization.strengths.map((item) => (
              <div key={item} className="soft-card">
                <div className="record-title">{item}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card form-stack">
          <div className="record-title">差距项</div>
          {resumeOptimization.gaps.map((item, index) => (
            <div key={`${item.gap}-${index}`} className="soft-card">
              <div className="record-title">{item.gap}</div>
              <div className="record-subtitle" style={{ marginTop: 8 }}>
                建议：{item.suggestion}
              </div>
            </div>
          ))}
        </div>

        <div className="card form-stack">
          <div className="record-title">成功率预测</div>
          <div className="soft-card">
            <div className="record-title">{resumeOptimization.successPrediction.level}</div>
            <div className="record-subtitle" style={{ marginTop: 8 }}>
              {resumeOptimization.successPrediction.reason}
            </div>
            <div className="record-subtitle" style={{ marginTop: 8 }}>
              {resumeOptimization.successPrediction.encouragement}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

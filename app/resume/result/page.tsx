"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CompareScoreRadar } from "@/components/resume-analytics";
import { usePrototypeStore } from "@/components/prototype-store";
import { ExpandableInfoBox } from "@/components/interactive";
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

function ResumeResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const readonly = searchParams.get("readonly") === "1";
  const recordId = searchParams.get("recordId");
  const { getResumeRecord, resumeOptimization } = usePrototypeStore();
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [debugExpanded, setDebugExpanded] = useState(false);
  const linkedRecord = recordId ? getResumeRecord(recordId) : undefined;
  const optimization = linkedRecord?.optimization ?? resumeOptimization;

  useEffect(() => {
    if (!optimization) {
      router.replace("/resume/upload");
    }
  }, [optimization, router]);

  const totalScore = useMemo(() => {
    if (!optimization) {
      return 0;
    }
    const values = dimensionMeta.map((item) => optimization.afterScores[item.key].finalScore);
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  }, [optimization]);

  const totalDelta = useMemo(() => {
    if (!optimization) {
      return 0;
    }
    const beforeValues = dimensionMeta.map((item) => optimization.beforeScores[item.key].score);
    const beforeAverage = beforeValues.reduce((sum, value) => sum + value, 0) / beforeValues.length;
    return Math.round((totalScore - beforeAverage) * 10) / 10;
  }, [optimization, totalScore]);

  const beforeRadar = dimensionMeta.map((item) => ({
    label: item.label,
    value: optimization?.beforeScores[item.key].score ? optimization.beforeScores[item.key].score * 10 : 0
  }));

  const afterRadar = dimensionMeta.map((item) => ({
    label: item.label,
    value: optimization?.afterScores[item.key].finalScore
      ? optimization.afterScores[item.key].finalScore * 10
      : 0
  }));

  const previewLines = useMemo(() => {
    if (!optimization) {
      return [];
    }
    const profile = optimization.optimizedResumeProfile;
    const lines: string[] = [];

    if (profile.basicInfo.name) {
      lines.push(profile.basicInfo.name);
    }

    [profile.basicInfo.gender, profile.basicInfo.phone, profile.basicInfo.email]
      .filter(Boolean)
      .forEach((item) => {
        lines.push(item);
      });

    if (
      profile.jobIntent.targetCity ||
      profile.jobIntent.earliestStartDate ||
      profile.jobIntent.internshipDuration ||
      profile.jobIntent.weeklyAvailability
    ) {
      lines.push("求职意向");
      if (profile.jobIntent.targetCity) {
        lines.push(`目标城市：${profile.jobIntent.targetCity}`);
      }
      if (profile.jobIntent.earliestStartDate) {
        lines.push(`最早到岗：${profile.jobIntent.earliestStartDate}`);
      }
      if (profile.jobIntent.internshipDuration) {
        lines.push(`实习时长：${profile.jobIntent.internshipDuration}`);
      }
      if (profile.jobIntent.weeklyAvailability) {
        lines.push(`每周出勤：${profile.jobIntent.weeklyAvailability}`);
      }
    }

    if (profile.education.length) {
      lines.push("教育经历");
    }
    profile.education.forEach((item) => {
      lines.push(`${item.school}｜${item.degree}｜${item.major}`);
      lines.push(`${item.startDate} - ${item.endDate}`);
      if (item.department) {
        lines.push(`院系：${item.department}`);
      }
      if (item.gpa) {
        lines.push(`GPA：${item.gpa}`);
      }
    });

    if (profile.workExperience.length) {
      lines.push("工作经历");
    }
    profile.workExperience.forEach((item) => {
      lines.push(`${item.company}｜${item.title}`);
      lines.push(`${item.startDate} - ${item.endDate}`);
      lines.push(item.description);
    });

    if (profile.projectExperience.length) {
      lines.push("项目经历");
    }
    profile.projectExperience.forEach((item) => {
      lines.push(`${item.projectName}｜${item.role}`);
      lines.push(`${item.startDate} - ${item.endDate}`);
      lines.push(item.description);
    });

    if (profile.awards.length) {
      lines.push("获奖信息");
    }
    profile.awards.forEach((item) => {
      lines.push(`${item.awardType}｜${item.awardName}｜${item.awardDate}`);
    });

    if (
      profile.skills.languageTests.length ||
      profile.skills.programmingLanguages.length ||
      profile.skills.aiSkills.length
    ) {
      lines.push("技能信息");
    }
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
  }, [optimization]);

  if (!optimization) {
    return null;
  }

  return (
    <div>
      <section className="section">
        <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 32px", alignItems: "center", gap: 8 }}>
          <Link
            href={readonly && recordId ? `/resume/diagnosis-result?recordId=${recordId}&readonly=1` : "/resume/diagnosis-result"}
            className="button-ghost"
            style={{ textAlign: "center", padding: 0 }}
          >
            &lt;
          </Link>
          <h1 className="section-title" style={{ textAlign: "center", margin: 0 }}>
            AI简历优化结果
          </h1>
          <span />
        </div>
      </section>
      <StepStrip steps={["上传简历与JD", "AI简历诊断", "AI简历优化"]} active={2} />

      <section className="section">
        <div className="score-card diagnosis-radar-card">
          <div className="diagnosis-total-score">
            <div className="muted">简历总分（满分10分）</div>
            <div className="score-big">{totalScore}</div>
            <div className="record-subtitle">
              优化后8维平均分，较优化前提升
              {totalDelta > 0 ? "+" : ""}
              {totalDelta}分
            </div>
          </div>
          <CompareScoreRadar beforeItems={beforeRadar} afterItems={afterRadar} hideTitle />
        </div>
      </section>

      <section className="section form-stack">
        <div className="card form-stack">
          <button
            type="button"
            className="diagnosis-card-toggle"
            onClick={() => setDetailsExpanded((current) => !current)}
          >
            <span className="record-title">8维提升明细</span>
            <span className={`diagnosis-toggle-icon${detailsExpanded ? " is-open" : ""}`}>▾</span>
          </button>
          {detailsExpanded
            ? dimensionMeta.map((item) => {
                const detail = optimization.afterScores[item.key];
                return (
                  <div key={item.key} className="soft-card">
                    <div className="record-title">{item.label}</div>
                    <div className="record-subtitle" style={{ marginTop: 8 }}>
                      原分 {detail.originalScore} / 提升 {detail.delta > 0 ? "+" : ""}
                      {detail.delta} / 当前 {detail.finalScore}
                    </div>
                    <div className="record-subtitle" style={{ marginTop: 10 }}>
                      {detail.reason}
                    </div>
                  </div>
                );
              })
            : null}
        </div>
      </section>

      <section className="card section form-stack">
        <div className="soft-card">
          <div className="record-title">优化后简历</div>
          <div className="preview-sheet rich-preview" style={{ marginTop: 10 }}>
            {previewLines.map((line, index) => (
              <div key={`${line}-${index}`} className="record-subtitle rich-preview-line">
                {line}
              </div>
            ))}
          </div>
        </div>

        <div className="soft-card">
          <div className="record-title">主要优势</div>
          <div className="form-stack" style={{ marginTop: 10 }}>
            {optimization.finalSummary.strengths.map((item, index) => (
              <div key={`${item}-${index}`} className="record-subtitle">
                {index + 1}. {item}
              </div>
            ))}
          </div>
        </div>

        <div className="soft-card">
          <div className="record-title">主要风险</div>
          <div className="form-stack" style={{ marginTop: 10 }}>
            {optimization.finalSummary.gaps.map((item, index) => (
              <div key={`${item}-${index}`} className="record-subtitle">
                {index + 1}. {item}
              </div>
            ))}
          </div>
        </div>

        <div className="soft-card">
          <div className="record-title">总结</div>
          <div className="record-subtitle" style={{ marginTop: 8 }}>
            当前简历投递成功率：{optimization.finalSummary.applicationCompetitiveness.level}
          </div>
          <div className="record-subtitle" style={{ marginTop: 14 }}>
            {optimization.finalSummary.encouragement}
          </div>
        </div>
      </section>

      <section className="section form-stack">
        <ExpandableInfoBox
          title="调试查看：优化模型完整输出"
          subtitle="用于核对大模型返回的全部结构化结果"
          content={optimization.rawModelOutput}
          isExpanded={debugExpanded}
          onToggle={setDebugExpanded}
        />
      </section>
    </div>
  );
}

export default function ResumeResultPage() {
  return (
    <Suspense fallback={null}>
      <ResumeResultContent />
    </Suspense>
  );
}

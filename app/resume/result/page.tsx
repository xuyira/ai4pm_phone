"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExportButton } from "@/components/interactive";
import { DimensionCard, ScoreRadar } from "@/components/resume-analytics";
import { usePrototypeStore } from "@/components/prototype-store";
import { useToast } from "@/components/toast";
import { PageIntro, StepStrip } from "@/components/ui";

function formatJobType(jobType: "intern" | "fulltime") {
  return jobType === "intern" ? "校招/实习" : "社招";
}

export default function ResumeResultPage() {
  const router = useRouter();
  const { push } = useToast();
  const { resumeDraft, resumeOptimization, setResumeOptimization } = usePrototypeStore();
  const [revisionNotes, setRevisionNotes] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (!resumeOptimization) {
      router.replace("/resume/upload");
    }
  }, [resumeOptimization, router]);

  const previewLines = useMemo(
    () =>
      (resumeOptimization?.optimizedResumeText ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 14),
    [resumeOptimization?.optimizedResumeText]
  );

  if (!resumeOptimization) {
    return null;
  }

  const presentationRadar = [
    {
      label: "结构",
      value: resumeOptimization.afterScores.resumePresentation.structureClarity.score
    },
    {
      label: "完整",
      value: resumeOptimization.afterScores.resumePresentation.informationCompleteness.score
    },
    {
      label: "量化",
      value: resumeOptimization.afterScores.resumePresentation.resultQuantification.score
    },
    {
      label: "产品表达",
      value: resumeOptimization.afterScores.resumePresentation.productExpression.score
    },
    {
      label: "重点取舍",
      value: resumeOptimization.afterScores.resumePresentation.priorityFocus.score
    }
  ];

  const matchRadar = [
    {
      label: "职责命中",
      value: resumeOptimization.afterScores.jobMatch.responsibilityCoverage.score
    },
    {
      label: "行业相关",
      value: resumeOptimization.afterScores.jobMatch.industryRelevance.score
    },
    {
      label: "ATS 词匹配",
      value: resumeOptimization.afterScores.jobMatch.atsKeywordMatch.score
    },
    {
      label: "硬要求",
      value: resumeOptimization.afterScores.jobMatch.hardRequirementFit.score
    }
  ];

  const handleExportDocx = async () => {
    const response = await fetch("/api/resume/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        filename: `${resumeOptimization.optimizedResumeDoc.candidateName || "optimized-resume"}.docx`,
        doc: resumeOptimization.optimizedResumeDoc
      })
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.detail ?? "DOCX 导出失败");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${resumeOptimization.optimizedResumeDoc.candidateName || "optimized-resume"}.docx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    push("DOCX 已生成。");
  };

  const handleRegenerate = async () => {
    if (!revisionNotes.trim()) {
      push("请先输入你的建议，再点击重新生成。建议中的关键点会直接影响本次改写。");
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await fetch("/api/resume/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jobTitle: resumeDraft.jobTitle,
          jobType: resumeDraft.jobType,
          jobDescription: resumeDraft.jobDescription,
          notes: resumeDraft.notes,
          revisionNotes: revisionNotes.trim(),
          resumeText: resumeDraft.extractedResume?.content ?? ""
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail ?? "重新生成失败");
      }

      setResumeOptimization(payload.result);
      push("已根据你的建议重新生成简历结果。原始简历评分保持不变。");
    } catch (error) {
      push(error instanceof Error ? error.message : "重新生成失败");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div>
      <PageIntro
        eyebrow="简历优化"
        title="优化结果已经准备好了"
        subtitle={resumeOptimization.summary}
      />
      <StepStrip steps={["上传简历与 JD", "AI 处理中", "结果页"]} active={2} />

      <section className="section score-panel">
        <div className="score-card">
          <div className="muted">优化后总分</div>
          <div className="score-big">{resumeOptimization.afterScores.overallScore}</div>
          <div className="record-subtitle">
            较优化前提升 {resumeOptimization.overallDelta > 0 ? "+" : ""}
            {resumeOptimization.overallDelta}
          </div>
        </div>
        <ScoreRadar title="简历表现" items={presentationRadar} />
        <ScoreRadar title="岗位匹配" items={matchRadar} />
      </section>

      <section className="card section form-stack">
        <div className="summary-row">
          <div>
            <div className="record-title">优化后简历预览</div>
            <div className="record-subtitle">
              {(resumeDraft.jobTitle || "目标岗位")} · {formatJobType(resumeDraft.jobType)}
            </div>
          </div>
          <span className="pill pill-done">已完成</span>
        </div>
        <div className="hint-banner">
          命中关键词：{resumeOptimization.jobKeywords.slice(0, 8).join(" / ")}
        </div>
        <div className="preview-sheet rich-preview">
          {previewLines.map((line, index) => (
            <div key={`${line}-${index}`} className="record-subtitle rich-preview-line">
              {line}
            </div>
          ))}
        </div>
        <div className="grid-2">
          <ExportButton
            label="导出 DOCX"
            onClick={async () => {
              try {
                await handleExportDocx();
              } catch (error) {
                push(error instanceof Error ? error.message : "DOCX 导出失败");
              }
            }}
          />
          <ExportButton
            label="导出 PDF"
            onClick={() => push("当前已支持导出 DOCX，PDF 可在下一步通过 DOCX 转换接入。")}
          />
        </div>
      </section>

      <section className="card form-stack">
        <div className="record-title">补充建议并重新生成</div>
        <div className="record-subtitle" style={{ marginBottom: 12 }}>
          请输入你希望本次优化重点调整的方向，系统会在保持原始简历评分不变的前提下重新生成新的优化结果。
        </div>
        <textarea
          className="textarea"
          rows={5}
          placeholder="例如：希望强化数据分析表达、突出跨团队协作、让项目结果更贴合增长岗位。"
          value={revisionNotes}
          onChange={(event) => setRevisionNotes(event.target.value)}
        />
        <button
          type="button"
          className="button"
          disabled={isRegenerating}
          onClick={handleRegenerate}
        >
          {isRegenerating ? "正在重新生成..." : "根据建议重新生成"}
        </button>
        <div className="record-subtitle" style={{ marginTop: 12 }}>
          原始简历评分：{resumeOptimization.beforeScores.overallScore}；当前优化后评分：{resumeOptimization.afterScores.overallScore}
        </div>
      </section>

      <section className="section form-stack">
        <div className="card">
          <div className="record-title">改写摘要</div>
          <div className="tag-row">
            {resumeOptimization.changeLog.map((item) => (
              <span key={item} className="tag-chip">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="card form-stack">
          <div className="record-title">岗位画像摘要</div>
          <div className="record-subtitle">{resumeOptimization.jobProfile.summary}</div>
          <div className="tag-row">
            {resumeOptimization.jobProfile.keywords.slice(0, 10).map((item) => (
              <span key={item} className="tag-chip">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="card form-stack">
          <div className="record-title">原始简历诊断</div>
          {resumeOptimization.baselineFindings.map((item, index) => (
            <div key={`${item.dimension}-${index}`} className="soft-card">
              <div className="summary-row">
                <div className="record-title">{item.dimension}</div>
              </div>
              <div className="record-subtitle" style={{ marginTop: 10 }}>
                问题：{item.issue}
              </div>
              <div className="record-subtitle" style={{ marginTop: 8 }}>
                证据：{item.evidence.join("；")}
              </div>
              <div className="record-subtitle" style={{ marginTop: 8 }}>
                建议：{item.recommendation}
              </div>
            </div>
          ))}
        </div>

        <div className="card form-stack">
          <div className="record-title">改写优先级</div>
          {resumeOptimization.rewritePriorities.map((item, index) => (
            <div key={`${item.targetSection}-${index}`} className="soft-card">
              <div className="summary-row">
                <div className="record-title">{item.targetSection}</div>
                <span className="pill">{item.priority.toUpperCase()}</span>
              </div>
              <div className="record-subtitle" style={{ marginTop: 10 }}>
                指令：{item.instruction}
              </div>
              <div className="record-subtitle" style={{ marginTop: 8 }}>
                原因：{item.reason}
              </div>
            </div>
          ))}
        </div>

        <div className="card form-stack">
          <div className="summary-row">
            <div className="record-title">简历表现评分</div>
            <div className="record-subtitle">
              优化前 {resumeOptimization.beforeScores.resumePresentation.averageScore} / 优化后{" "}
              {resumeOptimization.afterScores.resumePresentation.averageScore}
            </div>
          </div>
          <DimensionCard
            label="结构清晰度"
            detail={resumeOptimization.afterScores.resumePresentation.structureClarity}
          />
          <DimensionCard
            label="信息完整度"
            detail={resumeOptimization.afterScores.resumePresentation.informationCompleteness}
          />
          <DimensionCard
            label="结果量化度"
            detail={resumeOptimization.afterScores.resumePresentation.resultQuantification}
          />
          <DimensionCard
            label="产品表达度"
            detail={resumeOptimization.afterScores.resumePresentation.productExpression}
          />
          <DimensionCard
            label="重点取舍度"
            detail={resumeOptimization.afterScores.resumePresentation.priorityFocus}
          />
        </div>

        <div className="card form-stack">
          <div className="summary-row">
            <div className="record-title">岗位匹配评分</div>
            <div className="record-subtitle">
              优化前 {resumeOptimization.beforeScores.jobMatch.averageScore} / 优化后{" "}
              {resumeOptimization.afterScores.jobMatch.averageScore}
            </div>
          </div>
          <DimensionCard
            label="职责命中度"
            detail={resumeOptimization.afterScores.jobMatch.responsibilityCoverage}
          />
          <DimensionCard
            label="行业相关度"
            detail={resumeOptimization.afterScores.jobMatch.industryRelevance}
          />
          <DimensionCard
            label="ATS 关键词匹配度"
            detail={resumeOptimization.afterScores.jobMatch.atsKeywordMatch}
          />
          <DimensionCard
            label="硬性要求满足度"
            detail={resumeOptimization.afterScores.jobMatch.hardRequirementFit}
          />
        </div>

        <div className="card form-stack">
          <div className="record-title">关键词差距</div>
          {resumeOptimization.keywordGapAnalysis.map((item) => (
            <div key={item.keyword} className="soft-card">
              <div className="summary-row">
                <div className="record-title">{item.keyword}</div>
                <div className="record-subtitle">
                  原简历 {item.inOriginalResume ? "已出现" : "未出现"} / 优化后{" "}
                  {item.inOptimizedResume ? "已覆盖" : "仍未覆盖"}
                </div>
              </div>
              <div className="record-subtitle" style={{ marginTop: 10 }}>
                {item.recommendation}
              </div>
            </div>
          ))}
        </div>

        <div className="card form-stack">
          <div className="record-title">Gap 分析</div>
          <div>
            <div className="record-title" style={{ fontSize: 15 }}>
              Strong matches
            </div>
            {resumeOptimization.gapAnalysis.strongMatches.map((item) => (
              <div key={item} className="record-subtitle" style={{ marginTop: 8 }}>
                {item}
              </div>
            ))}
          </div>
          <div>
            <div className="record-title" style={{ fontSize: 15 }}>
              Reframed matches
            </div>
            {resumeOptimization.gapAnalysis.reframedMatches.map((item) => (
              <div key={item} className="record-subtitle" style={{ marginTop: 8 }}>
                {item}
              </div>
            ))}
          </div>
          <div>
            <div className="record-title" style={{ fontSize: 15 }}>
              Remaining gaps
            </div>
            {resumeOptimization.gapAnalysis.remainingGaps.map((item) => (
              <div key={item} className="record-subtitle" style={{ marginTop: 8 }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="card form-stack">
          <div className="record-title">Cover Letter Talking Points</div>
          {resumeOptimization.coverLetterTalkingPoints.map((item) => (
            <div key={item} className="record-subtitle">
              {item}
            </div>
          ))}
        </div>

        <div className="card form-stack">
          <div className="record-title">风险提示</div>
          {resumeOptimization.riskNotes.map((item) => (
            <div key={item} className="record-subtitle">
              {item}
            </div>
          ))}
        </div>
      </section>

      <div className="section">
        <Link href="/resume/upload" className="button-ghost">
          返回重新优化
        </Link>
      </div>
    </div>
  );
}

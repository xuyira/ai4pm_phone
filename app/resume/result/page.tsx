"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CompareScoreRadar } from "@/components/resume-analytics";
import { usePrototypeStore } from "@/components/prototype-store";
import { ExpandableInfoBox } from "@/components/interactive";
import { useToast } from "@/components/toast";
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

function ResumeResultContent() {
  const router = useRouter();
  const { push } = useToast();
  const searchParams = useSearchParams();
  const readonly = searchParams.get("readonly") === "1";
  const recordId = searchParams.get("recordId");
  const { getResumeRecord, resumeDraft, resumeOptimization } = usePrototypeStore();
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const pdfFrameRef = useRef<HTMLIFrameElement | null>(null);
  const linkedRecord = recordId ? getResumeRecord(recordId) : undefined;
  const optimization = linkedRecord?.optimization ?? resumeOptimization;
  const pageDraft = linkedRecord?.draft ?? resumeDraft;
  const [resumeExpanded, setResumeExpanded] = useState(false);
  const [jobExpanded, setJobExpanded] = useState(false);

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

  if (!optimization) {
    return null;
  }

  const profile = optimization.optimizedResumeProfile;
  const intentItems = [
    profile.jobIntent.targetRole ? `目标岗位：${profile.jobIntent.targetRole}` : "",
    profile.jobIntent.targetCity ? `目标城市：${profile.jobIntent.targetCity}` : "",
    profile.jobIntent.earliestStartDate ? `最早到岗：${profile.jobIntent.earliestStartDate}` : "",
    profile.jobIntent.internshipDuration ? `实习时长：${profile.jobIntent.internshipDuration}` : "",
    profile.jobIntent.weeklyAvailability ? `每周出勤：${profile.jobIntent.weeklyAvailability}` : ""
  ].filter(Boolean);

  const skillItems = [
    profile.skills.languages.length ? `语言：${profile.skills.languages.join(" / ")}` : "",
    profile.skills.tools.length ? `工具：${profile.skills.tools.join(" / ")}` : "",
    profile.skills.productSkills.length ? `产品：${profile.skills.productSkills.join(" / ")}` : "",
    profile.skills.technicalSkills.length ? `技术：${profile.skills.technicalSkills.join(" / ")}` : "",
    profile.skills.aiSkills.length ? `AI：${profile.skills.aiSkills.join(" / ")}` : "",
    profile.skills.certificates.length ? `证书：${profile.skills.certificates.join(" / ")}` : ""
  ].filter(Boolean);

  const printableResumeHtml = useMemo(() => {
    const escapeHtml = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    const normalizeText = (value: string) => value.replace(/\r\n/g, "\n").trim();
    const isPlaceholderText = (value: string) => {
      const normalized = normalizeText(value).replace(/[•·▪▫◦\-—–_]/g, "").trim();
      return !normalized;
    };
    const cleanText = (value?: string) => {
      if (!value) {
        return "";
      }
      return isPlaceholderText(value) ? "" : normalizeText(value);
    };
    const renderInlineRichText = (value: string) =>
      escapeHtml(value)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replaceAll("\n", "<br/>");
    const renderBulletLines = (lines: string[]) =>
      lines
        .map((line) => cleanText(line))
        .filter(Boolean)
        .map((line) => `<div class="pdf-bullet">${renderInlineRichText(line)}</div>`)
        .join("");
    const removeGpaFromDescription = (value: string, gpa?: string) => {
      let next = value;

      const repeatedScorePatterns = [
        /[；;，,、\s]*GPA[：:\s]*[^\n；;，,、]*/gi,
        /[；;，,、\s]*(?:专业课)?平均?学分绩[：:\s]*[^\n；;，,、]*/gi,
        /[；;，,、\s]*绩点[：:\s]*[^\n；;，,、]*/gi,
        /[；;，,、\s]*排名[：:\s]*[^\n；;，,、]*/gi,
        /[；;，,、\s]*前\d+%/gi
      ];

      repeatedScorePatterns.forEach((pattern) => {
        next = next.replace(pattern, " ");
      });

      const normalizedGpa = cleanText(gpa)
        .replace(/[（）()]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (normalizedGpa) {
        const escaped = normalizedGpa.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        next = next.replace(new RegExp(escaped, "gi"), " ");
      }

      return next
        .replace(/^[；;，,、\s]+|[；;，,、\s]+$/g, "")
        .replace(/\s{2,}/g, " ");
    };
    const renderSection = (title: string, body: string) =>
      body
        ? `<section class="pdf-section"><div class="pdf-section-title">${escapeHtml(title)}</div>${body}</section>`
        : "";
    const renderThreeColumnEntries = (
      items: Array<{
        time: string;
        center: string;
        right: string;
        details?: string[];
      }>
    ) =>
      items
        .map((item) => {
          const time = cleanText(item.time);
          const center = cleanText(item.center);
          const right = cleanText(item.right);
          const details = (item.details ?? []).map((detail) => cleanText(detail)).filter(Boolean);

          if (!time && !center && !right && details.length === 0) {
            return "";
          }

          return `
            <div class="pdf-entry">
              <div class="pdf-entry-head pdf-entry-head-grid">
                <div class="pdf-entry-time pdf-entry-time-left">${escapeHtml(time)}</div>
                <div class="pdf-entry-title pdf-entry-title-center">${escapeHtml(center)}</div>
                <div class="pdf-entry-right">${escapeHtml(right)}</div>
              </div>
              ${details.length ? `<div class="pdf-entry-details">${renderBulletLines(details)}</div>` : ""}
            </div>
          `;
        })
        .join("");

    const educationHtml = renderThreeColumnEntries(
      profile.education.map((item) => ({
        time: `${item.startDate} - ${item.endDate}`,
        center: [item.school, [item.major, item.college].filter(Boolean).join("/")].filter(Boolean).join(" | "),
        right: item.degree,
        details: [item.gpa ? `GPA：${item.gpa}` : "", removeGpaFromDescription(item.description, item.gpa)]
      }))
    );

    const workHtml = renderThreeColumnEntries(
      profile.workExperience.map((item) => ({
        time: `${item.startDate} - ${item.endDate}`,
        center: item.company,
        right: item.position,
        details: item.description.filter((line) => !isPlaceholderText(line))
      }))
    );

    const projectHtml = renderThreeColumnEntries(
      profile.projectExperience.map((item) => ({
        time: `${item.startDate} - ${item.endDate}`,
        center: item.projectName,
        right: item.role,
        details: item.description.filter((line) => !isPlaceholderText(line))
      }))
    );

    const achievementHtml = renderBulletLines(
      profile.achievements.map((item) => {
        const name = cleanText(item.name);
        const date = cleanText(item.date);
        const description = cleanText(item.description);
        const type = cleanText(item.type);

        const mainLine = [name, date ? `（${date}）` : "", !date && type ? `（${type}）` : ""]
          .filter(Boolean)
          .join("");

        return [mainLine, description].filter(Boolean).join("：");
      })
    );
    const autoFitScript = `
      (function () {
        function applyFit() {
          const page = document.querySelector('.pdf-page');
          const inner = document.querySelector('.pdf-page-inner');
          if (!page || !inner) return;

          const root = document.documentElement;
          let scale = 1;
          root.style.setProperty('--fit-scale', '1');

          const fits = () =>
            inner.scrollHeight <= page.clientHeight && inner.scrollWidth <= page.clientWidth;

          if (fits()) {
            return;
          }

          while (scale > 0.84) {
            scale = Math.round((scale - 0.02) * 100) / 100;
            root.style.setProperty('--fit-scale', String(scale));
            if (fits()) {
              break;
            }
          }
        }

        window.addEventListener('load', applyFit);
        window.addEventListener('resize', applyFit);
        window.addEventListener('beforeprint', applyFit);
      })();
    `;

    return `
      <!doctype html>
      <html lang="zh-CN">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(profile.basicInfo.name || "优化简历")}</title>
          <style>
            html {
              --fit-scale: 1;
            }
            body {
              margin: 0;
              background: #efe8dc;
              font-family: "Microsoft YaHei", sans-serif;
              color: #2f2924;
            }
            .pdf-page {
              width: 210mm;
              height: 297mm;
              margin: 0 auto;
              background: #fffdf9;
              box-sizing: border-box;
              padding: calc(12mm * var(--fit-scale)) calc(11mm * var(--fit-scale)) calc(10mm * var(--fit-scale));
              overflow: hidden;
            }
            .pdf-page-inner {
              width: 100%;
            }
            .pdf-header {
              border-bottom: 1px solid #d9cbb8;
              padding-bottom: calc(6px * var(--fit-scale));
            }
            .pdf-name {
              font-size: calc(22px * var(--fit-scale));
              font-weight: 800;
              line-height: 1.1;
            }
            .pdf-contact {
              margin-top: calc(6px * var(--fit-scale));
              font-size: calc(10.5px * var(--fit-scale));
              color: #5c5148;
              display: flex;
              flex-wrap: wrap;
              gap: calc(4px * var(--fit-scale)) calc(12px * var(--fit-scale));
            }
            .pdf-section {
              margin-top: calc(9px * var(--fit-scale));
            }
            .pdf-section-title {
              font-size: calc(11.5px * var(--fit-scale));
              font-weight: 800;
              padding-bottom: calc(3px * var(--fit-scale));
              border-bottom: 1px solid #dfd4c3;
            }
            .pdf-inline-list {
              margin-top: calc(5px * var(--fit-scale));
              font-size: calc(10.5px * var(--fit-scale));
              color: #4b433b;
              display: flex;
              flex-wrap: wrap;
              gap: calc(4px * var(--fit-scale)) calc(12px * var(--fit-scale));
            }
            .pdf-entry {
              margin-top: calc(6px * var(--fit-scale));
            }
            .pdf-entry-head {
              display: flex;
              justify-content: space-between;
              gap: calc(8px * var(--fit-scale));
              align-items: flex-start;
            }
            .pdf-entry-head-grid {
              display: grid;
              grid-template-columns: calc(84px * var(--fit-scale)) minmax(0, 1fr) auto;
              align-items: start;
            }
            .pdf-entry-title {
              font-size: calc(11px * var(--fit-scale));
              font-weight: 700;
            }
            .pdf-entry-title-center {
              text-align: center;
            }
            .pdf-entry-time {
              font-size: calc(10px * var(--fit-scale));
              color: #7a6d61;
              white-space: nowrap;
            }
            .pdf-entry-time-left {
              text-align: left;
            }
            .pdf-entry-right {
              font-size: calc(10.5px * var(--fit-scale));
              font-weight: 600;
              color: #4e453d;
              text-align: right;
              white-space: nowrap;
            }
            .pdf-entry-details {
              margin-top: calc(3px * var(--fit-scale));
            }
            .pdf-bullet {
              position: relative;
              padding-left: calc(11px * var(--fit-scale));
              font-size: calc(10px * var(--fit-scale));
              line-height: 1.4;
              color: #4b433b;
              white-space: normal;
            }
            .pdf-bullet::before {
              content: "•";
              position: absolute;
              left: 0;
              top: 0;
            }
            @page {
              size: A4;
              margin: 0;
            }
            @media print {
              body {
                background: white;
              }
              .pdf-page {
                margin: 0;
                width: 210mm;
                height: 297mm;
                padding: 12mm 11mm 10mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="pdf-page">
            <div class="pdf-page-inner">
              <div class="pdf-header">
                ${profile.basicInfo.name ? `<div class="pdf-name">${escapeHtml(profile.basicInfo.name)}</div>` : ""}
                <div class="pdf-contact">
                  ${profile.basicInfo.gender ? `<span>性别：${escapeHtml(profile.basicInfo.gender)}</span>` : ""}
                  ${profile.basicInfo.age ? `<span>年龄：${escapeHtml(profile.basicInfo.age)}</span>` : ""}
                  ${profile.basicInfo.phone ? `<span>电话：${escapeHtml(profile.basicInfo.phone)}</span>` : ""}
                  ${profile.basicInfo.email ? `<span>邮箱：${escapeHtml(profile.basicInfo.email)}</span>` : ""}
                </div>
              </div>
              ${renderSection("求职意向", intentItems.length ? `<div class="pdf-inline-list">${intentItems.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : "")}
              ${renderSection("教育经历", educationHtml)}
              ${renderSection("工作/实习经历", workHtml)}
              ${renderSection("项目经历", projectHtml)}
              ${renderSection("成果与荣誉", achievementHtml)}
              ${renderSection("技能信息", skillItems.length ? renderBulletLines(skillItems) : "")}
            </div>
          </div>
          <script>${autoFitScript}</script>
        </body>
      </html>
    `;
  }, [intentItems, profile, skillItems]);

  const handleExportHtml = async () => {
    try {
      const blob = new Blob([printableResumeHtml], {
        type: "text/html;charset=utf-8"
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${profile.basicInfo.name || "optimized-resume"}.html`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      push(error instanceof Error ? error.message : "HTML 导出失败。");
    }
  };

  const handleExportPdf = () => {
    const frameWindow = pdfFrameRef.current?.contentWindow;
    if (!frameWindow) {
      push("PDF 预览尚未准备好，请稍后再试。");
      return;
    }
    frameWindow.focus();
    frameWindow.print();
  };

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

      {pageDraft ? (
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
      ) : null}

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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              minWidth: 0
            }}
          >
            <div className="record-title" style={{ minWidth: 0 }}>
              优化后简历
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
              <button
                type="button"
                className="button-secondary"
                onClick={handleExportHtml}
                style={{ fontSize: 12, padding: "6px 10px" }}
              >
                导出HTML
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={handleExportPdf}
                style={{ fontSize: 12, padding: "6px 10px" }}
              >
                导出PDF
              </button>
            </div>
          </div>
          <div className="resume-pdf-frame" style={{ marginTop: 12 }}>
            <div className="resume-pdf-canvas">
              <iframe
                ref={pdfFrameRef}
                title="优化后简历PDF预览"
                srcDoc={printableResumeHtml}
                className="resume-pdf-iframe"
              />
            </div>
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
            当前简历投递成功率：{optimization.finalSummary.applicationLevel}
          </div>
          <div className="record-subtitle" style={{ marginTop: 14 }}>
            {optimization.finalSummary.encouragement}
          </div>
        </div>
      </section>

      {readonly && recordId ? (
        <section className="section" style={{ display: "flex", justifyContent: "center" }}>
          <Link href="/profile/records/resume" className="button-secondary">
            返回我的记录
          </Link>
        </section>
      ) : null}
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

import { CopyButton, ExportButton } from "@/components/interactive";
import { PageIntro, StepStrip } from "@/components/ui";

export default function ExperienceResultPage() {
  const summary = `项目名称：AI 工具产品实习
业务目标：提升团队内部 AI 工具在高频场景中的启用率与任务完成效率
我的角色：负责需求拆解、优先级判断、跨团队推进与上线复盘
核心动作：基于用户反馈识别瓶颈，优先推动模板化能力与埋点体系建设
结果表现：上线后关键流程使用率提升，团队对后续功能迭代判断更清晰`;

  return (
    <div>
      <PageIntro
        eyebrow="AI经历深挖"
        title="你的结构化经历库已经生成"
        subtitle="这份内容已经默认保存到“我的 > AI经历深挖”。你可以继续复制、导出或回头再补充细节。"
      />
      <StepStrip
        steps={["上传简历", "生成追问", "问题补充", "生成经历库", "结果"]}
        active={4}
      />
      <section className="card section form-stack">
        <div className="summary-row">
          <div>
            <div className="record-title">AI 工具产品实习</div>
            <div className="record-subtitle">已完成 · 2026.04.28 22:12 自动保存</div>
          </div>
          <span className="pill pill-done">已完成</span>
        </div>
        <div className="preview-sheet">
          <p style={{ marginTop: 0, lineHeight: 1.8, whiteSpace: "pre-line" }}>{summary}</p>
        </div>
        <div className="grid-2">
          <CopyButton text={summary} />
          <ExportButton label="保存 DOCX" />
        </div>
      </section>
    </div>
  );
}

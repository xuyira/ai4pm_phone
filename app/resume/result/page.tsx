import { ExportButton } from "@/components/interactive";
import { PageIntro, StepStrip } from "@/components/ui";

export default function ResumeResultPage() {
  return (
    <div>
      <PageIntro
        eyebrow="简历优化"
        title="优化结果已经准备好了"
        subtitle="这份结果已自动保存到“我的 > 简历优化”。当前为高保真静态演示，后续可直接接真实导出。"
      />
      <StepStrip steps={["上传简历与 JD", "AI 处理中", "结果页"]} active={2} />

      <section className="section score-panel">
        <div className="score-card">
          <div className="muted">优化后总分</div>
          <div className="score-big">84</div>
          <div className="record-subtitle">较优化前提升 13 分</div>
        </div>
        <div className="score-card">
          <div className="record-title">简历表现</div>
          <div className="chart-box">
            <div className="radar" />
            <div className="radar secondary" />
          </div>
        </div>
        <div className="score-card">
          <div className="record-title">岗位匹配</div>
          <div className="chart-box">
            <div className="radar" />
            <div className="radar secondary" />
          </div>
        </div>
      </section>

      <section className="card section form-stack">
        <div className="summary-row">
          <div>
            <div className="record-title">优化后简历预览</div>
            <div className="record-subtitle">腾讯产品策划 · 校招/实习</div>
          </div>
          <span className="pill pill-done">已保存</span>
        </div>
        <div className="preview-sheet">
          <div className="preview-line short" />
          <div className="preview-line mid" />
          <div className="preview-line" />
          <div className="preview-line short" />
          <div className="preview-line mid" />
          <div className="preview-line" />
          <div className="preview-line short" />
        </div>
        <div className="grid-2">
          <ExportButton label="导出 DOCX" />
          <ExportButton label="导出 PDF" />
        </div>
      </section>
    </div>
  );
}

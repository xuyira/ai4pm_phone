"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DeleteRecordButton, ExportButton } from "@/components/interactive";
import { usePrototypeStore } from "@/components/prototype-store";

export default function ResumeRecordDetailPage() {
  const params = useParams<{ id: string }>();
  const { getRecord } = usePrototypeStore();
  const record = getRecord(params.id);

  if (!record) {
    return (
      <div className="empty-state section">
        <h1 className="section-title">记录已不存在</h1>
        <p className="page-subtitle">它可能已经被删除。你可以返回“我的 &gt; AI简历优化”继续查看其他结果。</p>
        <Link href="/profile/records/resume" className="button-secondary">
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div>
      <section className="section">
        <div className="eyebrow">我的 &gt; AI简历优化</div>
        <h1 className="section-title" style={{ marginTop: 8 }}>
          {record.title}
        </h1>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          {record.timestamp} · {record.description}
        </p>
      </section>

      <section className="card section form-stack">
        <div className="summary-row">
          <span className="pill pill-done">已完成</span>
          <DeleteRecordButton id={record.id} />
        </div>
        <div className="score-card">
          <div className="muted">优化后总分</div>
          <div className="score-big">84</div>
          <div className="record-subtitle">简历表现 + 岗位匹配双维度综合评分</div>
        </div>
        <div className="preview-sheet">
          <div className="preview-line short" />
          <div className="preview-line mid" />
          <div className="preview-line" />
          <div className="preview-line short" />
          <div className="preview-line" />
        </div>
        <div className="grid-2">
          <Link href="/resume/result" className="button">
            打开正式结果页
          </Link>
          <ExportButton label="导出 PDF" />
        </div>
      </section>
    </div>
  );
}

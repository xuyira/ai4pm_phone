"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CopyButton, DeleteRecordButton } from "@/components/interactive";
import { usePrototypeStore } from "@/components/prototype-store";

export default function ExperienceRecordDetailPage() {
  const params = useParams<{ id: string }>();
  const { getRecord } = usePrototypeStore();
  const record = getRecord(params.id);

  if (!record) {
    return (
      <div className="empty-state section">
        <h1 className="section-title">记录已不存在</h1>
        <p className="page-subtitle">它可能已经被删除。你可以返回“我的 &gt; 经历深挖”继续查看其他记录。</p>
        <Link href="/profile/records/experience" className="button-secondary">
          返回列表
        </Link>
      </div>
    );
  }

  const isPending = record.status === "pending_questions";

  return (
    <div>
      <section className="section">
        <div className="eyebrow">我的 &gt; 经历深挖</div>
        <h1 className="section-title" style={{ marginTop: 8 }}>
          {record.title}
        </h1>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          {record.timestamp} · {record.description}
        </p>
      </section>

      <section className="card section form-stack">
        <div className="summary-row">
          <span className={`pill ${isPending ? "pill-pending" : "pill-done"}`}>
            {isPending ? "待补充" : "已完成"}
          </span>
          <DeleteRecordButton id={record.id} />
        </div>

        {isPending ? (
          <>
            <div className="hint-banner">
              这是第一次 AI 追问后的记录。后续可以继续补充问题，再生成最终经历库。
            </div>
            <div className="question-block">
              <p className="question-title">问题 1</p>
              <p>这个需求最初为什么被提出来？用户痛点主要分布在哪几个环节？</p>
              <textarea
                className="textarea"
                defaultValue="最初来自高频协作场景里的效率瓶颈，我们观察到用户在任务拆分与复用时存在明显断点。"
              />
            </div>
            <div className="grid-2">
              <Link href="/experience/questions" className="button">
                继续补充
              </Link>
              <CopyButton text="问题补充记录已复制。" />
            </div>
          </>
        ) : (
          <>
            <div className="preview-sheet">
              <p style={{ marginTop: 0, lineHeight: 1.8 }}>
                项目背景：排课助手用于缓解选课期课程冲突与人工排课成本问题。
                <br />
                目标用户：校内学生、教务协同角色。
                <br />
                我的动作：梳理问题优先级、搭建排课规则、推动研发与教务侧联调。
                <br />
                结果：提升排课效率，并沉淀了可复用的需求判断与迭代闭环表达。
              </p>
            </div>
            <div className="grid-2">
              <Link href="/experience/result" className="button">
                打开正式结果页
              </Link>
              <CopyButton text="结构化经历库记录已复制。" />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

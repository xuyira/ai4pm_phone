"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePrototypeStore } from "@/components/prototype-store";

export default function ResumeRecordDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { getResumeRecord, isHydrated, restoreResumeRecord } = usePrototypeStore();
  const record = getResumeRecord(params.id);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!record) {
      return;
    }

    const restored = restoreResumeRecord(record.id);
    if (!restored) {
      return;
    }

    if (record.status === "uploaded" || record.status === "diagnosing" || record.status === "diagnose_failed") {
      router.replace(`/resume/diagnosis-loading?recordId=${record.id}&readonly=1`);
      return;
    }

    if (record.status === "optimizing" || record.status === "optimize_failed") {
      router.replace(`/resume/loading?recordId=${record.id}&readonly=1`);
      return;
    }

    if (record.status === "optimized") {
      router.replace(`/resume/result?recordId=${record.id}&readonly=1`);
      return;
    }

    if (record.status === "diagnosed") {
      router.replace(`/resume/diagnosis-result?recordId=${record.id}&edit=1`);
      return;
    }

    router.replace(`/resume/diagnosis-result?recordId=${record.id}&readonly=1`);
  }, [isHydrated, record, restoreResumeRecord, router]);

  if (!isHydrated) {
    return (
      <div>
        <section className="section">
          <div className="eyebrow">我的 &gt; AI简历优化</div>
          <h1 className="section-title" style={{ marginTop: 8 }}>
            正在加载记录
          </h1>
          <p className="page-subtitle" style={{ marginTop: 0 }}>
            正在恢复本地保存的简历记录，请稍候。
          </p>
        </section>
      </div>
    );
  }

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
          正在恢复记录
        </h1>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          {record.timestamp} · 即将跳转到对应页面
        </p>
      </section>

      <section className="card section form-stack">
        <div className="hint-banner">
          正在为你恢复这条
          {record.status === "optimized"
            ? "已优化"
            : record.status === "diagnosed"
              ? "已诊断"
              : record.status === "uploaded"
                ? "已上传"
                : record.status === "diagnosing"
                ? "诊断中"
                : record.status === "optimizing"
                  ? "优化中"
                  : record.status === "diagnose_failed"
                    ? "诊断失败"
                    : "优化失败"}记录，请稍候。
        </div>
      </section>
    </div>
  );
}

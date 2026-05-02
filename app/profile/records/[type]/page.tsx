"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePrototypeStore } from "@/components/prototype-store";
import { getFeatureLabel, type FeatureType } from "@/lib/prototype-data";

function getEmptyText(type: FeatureType) {
  if (type === "positioning") {
    return "AI求职定位功能尚未开放，这里后续会保存方向推荐结果与定位建议。";
  }

  if (type === "delivery") {
    return "AI岗位投递功能尚未开放，这里后续会按投递批次和岗位标题保存记录。";
  }

  if (type === "interview") {
    return "AI模拟面试功能尚未开放，这里后续会保存题目集、回答记录和复盘结果。";
  }

  return "暂时还没有记录。";
}

export default function ProfileRecordListPage() {
  const params = useParams<{ type: FeatureType }>();
  const type = params.type;
  const { getRecordsByType } = usePrototypeStore();
  const items = getRecordsByType(type);

  return (
    <div>
      <section className="section">
        <div className="eyebrow">我的</div>
        <h1 className="section-title" style={{ marginTop: 8 }}>
          {getFeatureLabel(type)}记录
        </h1>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          按时间倒序展示。点击后进入对应结果页，支持从详情中删除记录。
        </p>
      </section>

      <section className="card section">
        {items.length > 0 ? (
          <div className="list-card">
            {items.map((item) => (
              <Link key={item.id} href={item.route} className="record-item">
                <div className="record-meta">
                  <span className="record-title">{item.title}</span>
                  <span className="record-subtitle">{item.subtitle}</span>
                  <span className="record-subtitle">{item.timestamp}</span>
                </div>
                <span
                  className={`pill ${
                    item.status === "pending_questions"
                      ? "pill-pending"
                      : "pill-done"
                  }`}
                >
                  {item.status === "pending_questions" ? "待补充" : "已完成"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2 className="section-title">还没有可查看的记录</h2>
            <p className="page-subtitle">{getEmptyText(type)}</p>
          </div>
        )}
      </section>
    </div>
  );
}

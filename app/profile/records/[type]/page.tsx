"use client";

import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { usePrototypeStore } from "@/components/prototype-store";
import { getFeatureLabel, type FeatureType, type RecordItem } from "@/lib/prototype-data";

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
  const router = useRouter();
  const params = useParams<{ type: FeatureType }>();
  const type = params.type;
  const { deleteRecord, getRecordsByType } = usePrototypeStore();
  const items = getRecordsByType(type);

  const getStatusCopy = (status: RecordItem["status"]) => {
    if (status === "uploaded" || status === "diagnosing" || status === "diagnose_failed") {
      return "已上传";
    }

    if (status === "diagnosed") {
      return "已诊断";
    }

    if (status === "optimized" || status === "optimizing" || status === "optimize_failed") {
      return "已优化";
    }

    return "已完成";
  };

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
              <button
                key={item.id}
                type="button"
                className="record-item profile-resume-row"
                onClick={() => router.push(item.route)}
              >
                <div className="record-meta" style={{ minWidth: 0 }}>
                  <span className="record-title" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.title}
                  </span>
                  <span className="record-subtitle">
                    {item.timestamp.replace(/^(\d{4})\.(\d{2})\.(\d{2}) (\d{2}):(\d{2})$/, "$1年$2月$3日$4:$5")}
                  </span>
                </div>
                <div className="profile-resume-row-side">
                  <button
                    type="button"
                    className="button-ghost profile-record-delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteRecord(item.id);
                      if (type === "resume") {
                        router.refresh();
                      }
                    }}
                  >
                    删除
                  </button>
                  <span className={`pill ${item.status === "optimized" || item.status === "optimizing" || item.status === "optimize_failed" ? "pill-done" : "pill-pending"}`}>
                    {getStatusCopy(item.status)}
                  </span>
                </div>
              </button>
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

"use client";

import { ProfileRecordLinks } from "@/components/interactive";
import { currentUser } from "@/lib/prototype-data";

export default function ProfilePage() {
  return (
    <div>
      <section className="profile-hero section">
        <div className="profile-top">
          <div className="avatar">◎</div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{currentUser.studentId}</div>
            <div style={{ opacity: 0.88 }}>{currentUser.email}</div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">我的记录</h2>
      </section>

      <ProfileRecordLinks />

      <section className="section form-stack">
        <div className="record-item">
          <div className="card" style={{ width: "100%" }}>
            <div className="record-item" style={{ padding: 0, borderBottom: 0 }}>
              <div className="record-meta">
                <span className="record-title">建议反馈</span>
                <span className="record-subtitle">建议被采纳可获得使用次数</span>
              </div>
              <span className="button-ghost">前往</span>
            </div>
          </div>
        </div>
        <div className="record-item" style={{ borderBottom: 0, padding: 0 }}>
          <div className="card" style={{ width: "100%" }}>
            <div className="record-item" style={{ padding: 0, borderBottom: 0 }}>
              <div className="record-meta">
                <span className="record-title">分享给朋友</span>
                <span className="record-subtitle">分享成功可获得使用次数</span>
              </div>
              <span className="button-ghost">前往</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "18px 0 8px" }}>
          <span className="record-subtitle">退出登录</span>
        </div>
      </section>
    </div>
  );
}

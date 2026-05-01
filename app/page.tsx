import Link from "next/link";
import { features } from "@/lib/prototype-data";

export default function HomePage() {
  return (
    <div>
      <section className="section home-intro">
        <h1 className="section-title" style={{ fontSize: 24, marginBottom: 10 }}>
          产品上岸 AI 助手
        </h1>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          专为产品经理打造的 AI 求职助手，帮你深挖项目经历、定制优化简历、匹配高质量岗位、准备真实面试。
        </p>
      </section>

      <section className="section">
        <div className="home-feature-grid">
          {features.map((feature) => {
            const isSoon =
              feature.type === "delivery" || feature.type === "interview";
            const content = (
              <>
                {isSoon ? <span className="corner-label">暂未上线</span> : null}
                <div style={{ fontSize: 14, textAlign: "center", marginTop: 6 }}>
                  AI
                </div>
                <div className="home-feature-title" style={{ textAlign: "center" }}>
                  {feature.title}
                </div>
              </>
            );

            return isSoon ? (
              <div
                key={feature.type}
                className={`feature-card home-feature-card ${feature.tone} is-disabled`}
                aria-disabled="true"
              >
                {content}
              </div>
            ) : (
              <Link
                key={feature.type}
                href={feature.href}
                className={`feature-card home-feature-card ${feature.tone}`}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="outlined-panel section" style={{ padding: 16 }}>
        <h2 className="info-block-title">功能介绍</h2>
        <div>
          <h3 className="info-item-title">AI 经历深挖</h3>
          <p className="info-item-copy">
            上传简历，AI会从产品经理8维能力模型出发，帮你在聊天中挖掘那些你本来就有，只是还没有写出来的产品能力与经历亮点。
          </p>

          <h3 className="info-item-title">AI 简历优化</h3>
          <p className="info-item-copy">
            上传简历与目标岗位JD，AI会从简历表现和岗位匹配两个维度，对现有简历进行系统优化，为你生成通过率更高的简历。
          </p>

          <h3 className="info-item-title">AI 岗位投递</h3>
          <p className="info-item-copy">
            上传简历与求职偏好，AI会帮你筛选高匹配岗位，自动生成打招呼话术，辅助你高效海投。
          </p>

          <h3 className="info-item-title">AI 模拟面试</h3>
          <p className="info-item-copy" style={{ marginBottom: 0 }}>
            上传简历和目标岗位JD，AI会从行为面、经历面、业务面以及行业洞察四大角度生成面试题及其优质回答，帮你提前准备面试。
          </p>
        </div>
      </section>
    </div>
  );
}

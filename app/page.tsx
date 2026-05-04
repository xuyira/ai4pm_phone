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
          专为产品经理打造的 AI 求职助手，帮你定位更适合的方向、定制优化简历、匹配高质量岗位、准备真实面试。
        </p>
      </section>

      <section className="section">
        <div className="home-feature-grid">
          {features.map((feature) => {
            const hasComingSoonLabel =
              feature.type === "positioning" || feature.type === "delivery" || feature.type === "interview";
            const isDisabled =
              feature.type === "positioning" || feature.type === "delivery" || feature.type === "interview";
            const content = (
              <>
                {hasComingSoonLabel ? <span className="corner-label">{"\u3000暂未上线"}</span> : null}
                <div className="home-feature-title" style={{ textAlign: "center" }}>
                  <span style={{ display: "block" }}>AI</span>
                  <span style={{ display: "block" }}>{feature.title.replace(/^AI/, "")}</span>
                </div>
              </>
            );

            return isDisabled ? (
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
          <p className="info-item-copy">
            <span className="info-item-title">1. AI求职定位：</span>
            上传简历后，AI 会结合你的经历背景、能力特征与不同产品经理方向的要求，推荐更适合你的求职方向与发力重点。
          </p>

          <p className="info-item-copy">
            <span className="info-item-title">2. AI简历优化：</span>
            上传简历与目标岗位JD，AI会从8个维度进行全面简历诊断，并引导你补充与岗位契合的经历信息，最终生成更符合目标产品岗位要求的优化版简历。
          </p>

          <p className="info-item-copy">
            <span className="info-item-title">3. AI岗位投递：</span>
            上传简历与求职偏好，AI会帮你筛选高匹配岗位，自动生成打招呼话术，辅助你高效海投。
          </p>

          <p className="info-item-copy" style={{ marginBottom: 0 }}>
            <span className="info-item-title">4. AI模拟面试：</span>
            上传简历和目标岗位JD，AI会从行为面、经历面、业务面以及行业洞察四大角度生成面试题及其优质回答，帮你提前准备面试。
          </p>
        </div>
      </section>
    </div>
  );
}

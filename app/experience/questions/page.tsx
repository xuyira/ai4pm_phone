import Link from "next/link";
import {
  experienceProjects,
  experienceQuestions
} from "@/lib/prototype-data";
import { PageIntro, StepStrip } from "@/components/ui";

export default function ExperienceQuestionsPage() {
  return (
    <div>
      <PageIntro
        eyebrow="经历深挖"
        title="补充回答后，AI 才能生成更能打的项目表达"
        subtitle="左侧切换不同经历，右侧补充 AI 追问。你也可以手动补充细节，结果会自动保存到“我的 > 经历深挖”。"
      />
      <StepStrip
        steps={["上传简历", "生成追问", "问题补充", "生成经历库", "结果"]}
        active={2}
      />
      <section className="card section">
        <div className="two-col">
          <div className="side-list">
            {experienceProjects.map((project, index) => (
              <div
                key={project.title}
                className={`side-item${index === 0 ? " is-active" : ""}`}
              >
                <strong style={{ display: "block", marginBottom: 6 }}>
                  {project.title}
                </strong>
                <span className="record-subtitle">
                  {project.period || project.team}
                </span>
              </div>
            ))}
          </div>

          <div className="form-stack">
            <div className="hint-banner">
              当前记录处于“待补充”状态。你也可以稍后在“我的 &gt; 经历深挖”继续回来写。
            </div>
            {experienceQuestions.map((question, index) => (
              <div key={question} className="question-block">
                <p className="question-title">问题 {index + 1}</p>
                <p style={{ marginTop: 0, lineHeight: 1.7 }}>{question}</p>
                <textarea
                  className="textarea"
                  defaultValue={
                    index === 0
                      ? "最初来自校内用户频繁调课与教室冲突的痛点，我们先聚焦在选课周的高峰场景。"
                      : ""
                  }
                  placeholder="在这里补充你的背景、动作、方案、结果与反思。"
                />
              </div>
            ))}
            <div className="question-block">
              <p className="question-title">自定义补充</p>
              <textarea
                className="textarea"
                placeholder="例如补充你跨团队协调、数据分析、需求优先级判断等细节。"
              />
            </div>
            <Link href="/experience/loading-result" className="button">
              生成我的经历库
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

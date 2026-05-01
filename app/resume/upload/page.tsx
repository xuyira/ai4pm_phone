import Link from "next/link";
import {
  FakeUploadCard,
  RecordSummaryLinks,
  ResumeTypeSwitch
} from "@/components/interactive";
import { PageIntro, StepStrip } from "@/components/ui";

export default function ResumeUploadPage() {
  return (
    <div>
      <PageIntro
        eyebrow="简历优化"
        title="上传简历和目标 JD，AI 会输出优化结果"
        subtitle="本轮原型先做静态填写演示，但页面结构会直接保留给后续真实 AI 接入。"
      />
      <StepStrip steps={["上传简历与 JD", "AI 处理中", "结果页"]} active={0} />
      <section className="card section form-stack">
        <FakeUploadCard />

        <div>
          <label className="field-label">岗位标题</label>
          <input className="input" defaultValue="腾讯产品策划" />
        </div>

        <div>
          <label className="field-label">岗位类型</label>
          <ResumeTypeSwitch />
        </div>

        <div>
          <label className="field-label">岗位内容 JD</label>
          <textarea
            className="textarea"
            defaultValue="负责内容产品规划、需求分析、用户调研与策略优化；能够与设计、研发、运营协同推进版本落地。"
          />
        </div>

        <div>
          <label className="field-label">其他备注</label>
          <textarea
            className="textarea"
            defaultValue="希望更突出数据分析能力、项目推进能力，以及对校园产品场景的理解。"
          />
        </div>

        <RecordSummaryLinks />
        <Link href="/resume/loading" className="button">
          开始简历优化
        </Link>
      </section>
    </div>
  );
}

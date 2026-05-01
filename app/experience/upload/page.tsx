import Link from "next/link";
import { FakeUploadCard, RecordSummaryLinks } from "@/components/interactive";
import { PageIntro, StepStrip } from "@/components/ui";

export default function ExperienceUploadPage() {
  return (
    <div>
      <PageIntro
        eyebrow="经历深挖"
        title="先上传简历，AI 会帮你生成深挖问题"
        subtitle="第一轮 AI 会先识别你的项目经历，并从产品经理关键能力视角生成 3-5 个追问。"
      />
      <section className="section">
        <StepStrip
          steps={["上传简历", "生成追问", "问题补充", "生成经历库", "结果"]}
          active={0}
        />
      </section>
      <section className="card section form-stack">
        <FakeUploadCard />
        <RecordSummaryLinks />
        <Link href="/experience/loading-questions" className="button">
          开始经历深挖
        </Link>
      </section>
    </div>
  );
}

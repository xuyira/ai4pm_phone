import Link from "next/link";
import { PageIntro, StatusPage, StepStrip } from "@/components/ui";

export default function ExperienceLoadingQuestionsPage() {
  return (
    <div>
      <PageIntro
        eyebrow="经历深挖"
        title="AI 正在生成深挖问题"
        subtitle="这一步会先拆解你的项目经历，提炼适合继续追问的场景、指标和推动动作。"
      />
      <StepStrip
        steps={["上传简历", "生成追问", "问题补充", "生成经历库", "结果"]}
        active={1}
      />
      <StatusPage
        title="预计 1-2 分钟"
        copy="你可以继续停留在这里，也可以稍后回来。问题生成完成后，会保存在“我的 > 经历深挖”中。"
        hint="等待页会明确告诉用户去哪里查看：本次结果会先进入“我的 > 经历深挖”，状态为“待补充”。"
        ctaLabel="查看问题补充页示例"
        ctaHref="/experience/questions"
      />
      <div className="section">
        <Link href="/profile/records/experience" className="button-ghost">
          先去我的 &gt; 经历深挖
        </Link>
      </div>
    </div>
  );
}

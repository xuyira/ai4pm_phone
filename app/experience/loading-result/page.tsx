import Link from "next/link";
import { PageIntro, StatusPage, StepStrip } from "@/components/ui";

export default function ExperienceLoadingResultPage() {
  return (
    <div>
      <PageIntro
        eyebrow="AI经历深挖"
        title="AI 正在生成结构化经历库"
        subtitle="这一步会综合你的简历、补充回答与能力线索，沉淀成可复用的项目表达素材。"
      />
      <StepStrip
        steps={["上传简历", "生成追问", "问题补充", "生成经历库", "结果"]}
        active={3}
      />
      <StatusPage
        title="预计 1 分钟左右"
        copy="生成完成后，你可以在结果页查看，也可以稍后前往“我的 > AI经历深挖 > 已完成记录”继续浏览。"
        hint="等待页需说清楚去哪看：最终经历库会保存到“我的 > AI经历深挖”，状态为“已完成”。"
        ctaLabel="查看最终结果页"
        ctaHref="/experience/result"
      />
      <div className="section">
        <Link href="/profile/records/experience" className="button-ghost">
          去我的 &gt; AI经历深挖 查看记录
        </Link>
      </div>
    </div>
  );
}

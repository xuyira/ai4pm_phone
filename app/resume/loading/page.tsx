import Link from "next/link";
import { PageIntro, StatusPage, StepStrip } from "@/components/ui";

export default function ResumeLoadingPage() {
  return (
    <div>
      <PageIntro
        eyebrow="简历优化"
        title="AI 正在诊断并优化你的简历"
        subtitle="系统会同时从简历表现与岗位匹配两条线分析，并生成优化后的版本。"
      />
      <StepStrip steps={["上传简历与 JD", "AI 处理中", "结果页"]} active={1} />
      <StatusPage
        title="预计 1-2 分钟"
        copy="你可以稍后回来。优化结果会自动保存到“我的 > 简历优化”中，之后可继续查看或删除。"
        hint="等待页说明查看路径：本次优化记录会进入“我的 > 简历优化”。"
        ctaLabel="查看优化结果"
        ctaHref="/resume/result"
      />
      <div className="section">
        <Link href="/profile/records/resume" className="button-ghost">
          去我的 &gt; 简历优化 查看记录
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { FakeUploadCard, ResumeTypeSwitch, ProjectMaterialsUploadCard } from "@/components/interactive";
import { usePrototypeStore } from "@/components/prototype-store";
import { useToast } from "@/components/toast";
import { StepStrip } from "@/components/ui";

export default function ResumeUploadPage() {
  const router = useRouter();
  const { push } = useToast();
  const { resumeDraft, updateResumeDraft } = usePrototypeStore();

  const handleStart = () => {
    if (!resumeDraft.extractedResume?.content.trim()) {
      push("请先上传简历，并等待文本提取完成。");
      return;
    }

    if (!resumeDraft.jobDescription.trim()) {
      push("请先填写目标岗位 JD。");
      return;
    }

    router.push("/resume/diagnosis-loading");
  };

  return (
    <div>
      <section className="section">
        <h1 className="resume-page-title">AI简历优化</h1>
      </section>
      <StepStrip steps={["上传简历与JD", "AI简历诊断", "AI简历优化"]} active={0} />

      <section className="section form-stack">
        <div className="resume-block">
          <div className="resume-block-head">
            <span className="resume-block-index">1</span>
            <h2 className="resume-block-title">上传简历</h2>
          </div>
          <div className="card">
            <FakeUploadCard variant="resume" />
          </div>
        </div>

        <div className="resume-block">
          <div className="resume-block-head">
            <span className="resume-block-index">2</span>
            <h2 className="resume-block-title">填写目标岗位JD</h2>
          </div>
          <div className="card form-stack">
            <div>
              <label className="field-label">岗位标题</label>
              <input
                className="input"
                placeholder="如：高级产品经理"
                value={resumeDraft.jobTitle}
                onChange={(event) => updateResumeDraft({ jobTitle: event.target.value })}
              />
            </div>

            <div>
              <label className="field-label">岗位类型</label>
              <ResumeTypeSwitch
                value={resumeDraft.jobType}
                onChange={(jobType) => updateResumeDraft({ jobType })}
              />
            </div>

            <div>
              <label className="field-label">岗位内容<span className="required">*</span></label>
              <textarea
                className="textarea"
                placeholder="请粘贴目标岗位的职责描述和任职要求..."
                value={resumeDraft.jobDescription}
                onChange={(event) => updateResumeDraft({ jobDescription: event.target.value })}
              />
            </div>

            <div>
              <label className="field-label">其他备注</label>
              <textarea
                className="textarea"
                placeholder="其他需要补充的信息..."
                value={resumeDraft.notes}
                onChange={(event) => updateResumeDraft({ notes: event.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="resume-block">
          <div className="resume-block-head">
            <span className="resume-block-index">3</span>
            <h2 className="resume-block-title">补充项目资料（可选）</h2>
          </div>
          <div className="card">
            <ProjectMaterialsUploadCard />
          </div>
        </div>

        <button type="button" className="button" onClick={handleStart}>
          开始AI简历诊断
        </button>
      </section>
    </div>
  );
}

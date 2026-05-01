import Link from "next/link";
import {
  FakeUploadCard,
  ResumeTypeSwitch
} from "@/components/interactive";

export default function ResumeUploadPage() {
  return (
    <div>
      <section className="section">
        <h1 className="resume-page-title">简历优化</h1>
      </section>

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
              <input className="input" placeholder="如：高级产品经理" />
            </div>

            <div>
              <label className="field-label">岗位类型</label>
              <ResumeTypeSwitch />
            </div>

            <div>
              <label className="field-label">岗位内容</label>
              <textarea
                className="textarea"
                placeholder="请粘贴目标岗位的职责描述和任职要求..."
              />
            </div>

            <div>
              <label className="field-label">其他备注</label>
              <textarea
                className="textarea"
                placeholder="其他需要补充的信息..."
              />
            </div>
          </div>
        </div>

        <Link href="/resume/loading" className="button">
          开始简历优化
        </Link>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePrototypeStore } from "@/components/prototype-store";
import { useToast } from "@/components/toast";
import { getFeatureLabel, type FeatureType } from "@/lib/prototype-data";

export function FakeUploadCard({
  fileName = "徐怡然-产品经理简历.pdf",
  variant = "default"
}: {
  fileName?: string;
  variant?: "default" | "resume";
}) {
  const [selected, setSelected] = useState(false);
  const [currentName, setCurrentName] = useState(fileName);
  const [isExtracting, setIsExtracting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { resumeDraft, setResumeExtraction, updateResumeDraft } = usePrototypeStore();

  const openFilePicker = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  useEffect(() => {
    if (variant !== "resume" || !resumeDraft.extractedResume) {
      return;
    }

    setSelected(true);
    setCurrentName(resumeDraft.extractedResume.filename);
    setParseError(null);
  }, [resumeDraft.extractedResume, variant]);

  return (
    <div>
      {variant === "resume" && selected && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button
            type="button"
            className="button-secondary"
            style={{ 
              fontSize: 12, 
              padding: "6px 12px", 
              backgroundColor: "#ff4444", 
              color: "white",
              border: "none"
            }}
            onClick={() => {
              setSelected(false);
              setCurrentName(fileName);
              setParseError(null);
              updateResumeDraft({ extractedResume: null });
            }}
          >
            删除文件
          </button>
        </div>
      )}
      <div
        className={`upload-box${variant === "resume" ? " upload-box-resume" : ""}`}
        onClick={() => {
          if (variant === "resume") {
            openFilePicker();
          }
        }}
        role={variant === "resume" ? "button" : undefined}
        tabIndex={variant === "resume" ? 0 : undefined}
        onKeyDown={(event) => {
          if (variant !== "resume") {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
          }
        }}
      >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }
          setSelected(true);
          setCurrentName(file.name);
          setIsExtracting(true);
          setParseError(null);

          const formData = new FormData();
          formData.append("file", file);

          void fetch("/api/parse_resume", {
            method: "POST",
            body: formData
          })
            .then(async (response) => {
              const payload = await response.json();
              if (!response.ok) {
                throw new Error(payload.detail ?? "解析失败");
              }
              if (variant === "resume") {
                setResumeExtraction(payload);
              }
            })
            .catch((error: Error) => {
              setParseError(error.message);
            })
            .finally(() => {
              setIsExtracting(false);
            });
        }}
      />
      <div className="upload-icon">↥</div>
      <div>
        <div
          style={{
            fontSize: variant === "resume" ? 18 : 20,
            fontWeight: 700,
            textAlign: variant === "resume" ? "center" : "left"
          }}
        >
          {selected ? currentName : "点击或拖拽上传简历"}
        </div>
        <p
          className="page-subtitle"
          style={{ marginTop: 8, textAlign: variant === "resume" ? "center" : "left" }}
        >
          {selected
            ? isExtracting
              ? "正在提取简历文本，请稍候..."
              : parseError
                ? `当前选择文件解析失败：${parseError}，点击可更换文件`
                : variant === "resume" && resumeDraft.extractedResume
                  ? `当前选择文件已完成解析（${resumeDraft.extractedResume.charCount}字），点击可更换文件`
                  : "已完成选择，可继续填写目标岗位 JD。"
            : "仅支持 PDF/DOCX 格式（不支持加密/扫描件），10MB 以内"}
        </p>
      </div>
      {variant !== "resume" && (
        <button
          type="button"
          className="button-secondary"
          onClick={(event) => {
            event.stopPropagation();
            openFilePicker();
          }}
        >
          {selected ? "重新选择" : "选择文件"}
        </button>
      )}
      </div>
    </div>
  );
}

export function RecordSummaryLinks() {
  return (
    <div className="hint-banner">
      所有 AI 结果默认保存到云端。你可以稍后前往“我的 &gt; 对应功能记录”继续查看。
    </div>
  );
}

export function ResumeTypeSwitch({
  value: controlledValue,
  onChange
}: {
  value?: "intern" | "fulltime";
  onChange?: (value: "intern" | "fulltime") => void;
}) {
  const [uncontrolledValue, setUncontrolledValue] = useState<"intern" | "fulltime">("intern");
  const value = controlledValue ?? uncontrolledValue;

  const setValue = (nextValue: "intern" | "fulltime") => {
    if (controlledValue === undefined) {
      setUncontrolledValue(nextValue);
    }
    onChange?.(nextValue);
  };

  return (
    <div className="grid-2">
      <button
        type="button"
        className={`chip-button${value === "intern" ? " is-active" : ""}`}
        onClick={() => setValue("intern")}
      >
        校招/实习
      </button>
      <button
        type="button"
        className={`chip-button${value === "fulltime" ? " is-active" : ""}`}
        onClick={() => setValue("fulltime")}
      >
        社招
      </button>
    </div>
  );
}

export function ProjectMaterialsUploadCard() {
  const [selected, setSelected] = useState(false);
  const [currentName, setCurrentName] = useState("项目资料.pdf");
  const [isExtracting, setIsExtracting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { resumeDraft, setProjectMaterials, updateResumeDraft } = usePrototypeStore();

  const openFilePicker = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  useEffect(() => {
    if (!resumeDraft.projectMaterials) {
      return;
    }

    setSelected(true);
    setCurrentName(resumeDraft.projectMaterials.filename);
    setParseError(null);
  }, [resumeDraft.projectMaterials]);

  return (
    <div>
      {selected && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button
            type="button"
            className="button-secondary"
            style={{ 
              fontSize: 12, 
              padding: "6px 12px", 
              backgroundColor: "#ff4444", 
              color: "white",
              border: "none"
            }}
            onClick={() => {
              setSelected(false);
              setCurrentName("项目资料.pdf");
              setParseError(null);
              updateResumeDraft({ projectMaterials: null });
            }}
          >
            删除文件
          </button>
        </div>
      )}
      <div
        className="upload-box upload-box-resume"
        onClick={openFilePicker}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFilePicker();
          }
        }}
      >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }
          setSelected(true);
          setCurrentName(file.name);
          setIsExtracting(true);
          setParseError(null);

          const formData = new FormData();
          formData.append("file", file);

          void fetch("/api/parse_resume", {
            method: "POST",
            body: formData
          })
            .then(async (response) => {
              const payload = await response.json();
              if (!response.ok) {
                throw new Error(payload.detail ?? "解析失败");
              }
              setProjectMaterials(payload);
            })
            .catch((error: Error) => {
              setParseError(error.message);
            })
            .finally(() => {
              setIsExtracting(false);
            });
        }}
      />
      <div className="upload-icon">↥</div>
      <div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            textAlign: "center"
          }}
        >
          {selected ? currentName : "点击或拖拽上传项目资料"}
        </div>
        <p
          className="page-subtitle"
          style={{ marginTop: 8, textAlign: "center" }}
        >
          {selected
            ? isExtracting
              ? "正在提取项目资料文本，请稍候..."
              : parseError
                ? `当前选择文件解析失败：${parseError}，点击可更换文件`
                : resumeDraft.projectMaterials
                  ? `当前选择文件已完成解析（${resumeDraft.projectMaterials.charCount}字），点击可更换文件`
                  : "已完成选择，可继续填写目标岗位 JD。"
            : "仅支持 PDF/DOCX 格式（不支持加密/扫描件），10MB 以内"}
        </p>
      </div>
      </div>
    </div>
  );
}

export function DeleteRecordButton({ id }: { id: string }) {
  const router = useRouter();
  const { deleteRecord } = usePrototypeStore();
  const { push } = useToast();

  return (
    <button
      type="button"
      className="button-secondary"
      onClick={() => {
        const ok = window.confirm("确认删除这条记录吗？原型会立刻从“我的”列表中移除。");
        if (!ok) {
          return;
        }
        deleteRecord(id);
        push("记录已删除，模拟为已从服务器移除。");
        router.push("/profile");
      }}
    >
      删除记录
    </button>
  );
}

export function CopyButton({ text }: { text: string }) {
  const { push } = useToast();

  return (
    <button
      type="button"
      className="button-secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          push("内容已复制，可直接整理到你的项目库素材中。");
        } catch {
          push("当前环境未开放剪贴板，原型交互已触发。");
        }
      }}
    >
      复制内容
    </button>
  );
}

export function ExportButton({
  label,
  onClick
}: {
  label: string;
  onClick?: () => void | Promise<void>;
}) {
  const { push } = useToast();

  return (
    <button
      type="button"
      className="button-secondary"
      onClick={() => {
        if (onClick) {
          void onClick();
          return;
        }

        push(`${label} 已加入导出队列，正式版会保存到本地。`);
      }}
    >
      {label}
    </button>
  );
}

export function ProfileRecordLinks() {
  const { getRecordsByType } = usePrototypeStore();

  const items: FeatureType[] = ["resume", "positioning", "delivery", "interview"];

  return (
    <div className="record-grid-card section">
      {items.map((type) => {
        const records = getRecordsByType(type);
        const toneClass =
          type === "resume"
            ? "warm-lime"
            : type === "positioning"
              ? "warm-yellow"
              : type === "delivery"
                ? "warm-blue"
                : "warm-purple";

        const isClickable = type === "resume";

        if (!isClickable) {
          return (
            <div
              key={type}
              className="record-grid-item"
              aria-disabled="true"
              style={{ opacity: 0.65, cursor: "not-allowed" }}
            >
              <div className={`record-square ${toneClass}`} />
              <div className="record-meta">
                <span className="record-title">{getFeatureLabel(type)}</span>
                <span className="record-subtitle">敬请期待</span>
              </div>
              <span className="button-ghost">暂未开放</span>
            </div>
          );
        }

        return (
          <Link
            key={type}
            href={`/profile/records/${type}`}
            className="record-grid-item"
          >
            <div className={`record-square ${toneClass}`} />
            <div className="record-meta">
              <span className="record-title">{getFeatureLabel(type)}</span>
              <span className="record-subtitle">{`共 ${records.length} 条记录`}</span>
            </div>
            <span className="button-ghost">查看</span>
          </Link>
        );
      })}
    </div>
  );
}

export function ExpandableInfoBox({
  title,
  subtitle,
  content,
  isExpanded: controlledExpanded,
  onToggle
}: {
  title: string;
  subtitle?: string;
  content: string;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false);
  const isExpanded = controlledExpanded ?? uncontrolledExpanded;

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    if (controlledExpanded === undefined) {
      setUncontrolledExpanded(newExpanded);
    }
    onToggle?.(newExpanded);
  };

  return (
    <div
      style={{
        padding: 14,
        backgroundColor: "rgba(255, 253, 248, 0.94)",
        borderRadius: 18,
        border: "1px solid rgba(231, 208, 153, 0.5)",
        cursor: "pointer",
        userSelect: "none"
      }}
      onClick={handleToggle}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{ fontSize: 16, color: "var(--text)", flexShrink: 0 }}>
          {isExpanded ? "▼" : "▶"}
        </div>
      </div>
      {isExpanded && (
        <div
          style={{
            marginTop: 12,
            fontSize: 13,
            color: "var(--text)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: 300,
            overflow: "auto"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      )}
    </div>
  );
}

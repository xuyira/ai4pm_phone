"use client";

import Link from "next/link";

export function PageIntro({
  eyebrow,
  title,
  subtitle
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="section">
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      <h1 className="section-title" style={{ marginTop: eyebrow ? 8 : 0 }}>
        {title}
      </h1>
      {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
    </section>
  );
}

export function StepStrip({
  steps,
  active,
  onStepClick,
  isStepClickable
}: {
  steps: string[];
  active: number;
  onStepClick?: (index: number) => void;
  isStepClickable?: (index: number) => boolean;
}) {
  return (
    <div className="step-strip">
      {steps.map((label, index) => (
        <button
          type="button"
          key={label}
          className={`step${index === active ? " is-active" : ""}${isStepClickable?.(index) ? " is-clickable" : ""}`}
          onClick={() => {
            if (isStepClickable?.(index) && onStepClick) {
              onStepClick(index);
            }
          }}
          disabled={!isStepClickable?.(index)}
        >
          <span className="step-label">
            {index + 1} {label}
          </span>
        </button>
      ))}
    </div>
  );
}

export function StatusPage({
  title,
  copy,
  hint,
  ctaLabel,
  ctaHref
}: {
  title: string;
  copy: string;
  hint: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="card status-card section">
      <div className="loader-ring" aria-hidden />
      <div>
        <h2 className="section-title" style={{ marginBottom: 10 }}>
          {title}
        </h2>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          {copy}
        </p>
      </div>
      <div className="hint-banner">{hint}</div>
      {ctaHref && ctaLabel ? (
        <Link href={ctaHref} className="button-secondary">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

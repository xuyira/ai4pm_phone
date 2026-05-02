"use client";

import type { ResumeDimensionScore } from "@/components/prototype-store";

type RadarItem = {
  label: string;
  value: number;
};

function polarToCartesian(angle: number, radius: number) {
  const radians = (angle - 90) * (Math.PI / 180);
  return {
    x: 60 + radius * Math.cos(radians),
    y: 60 + radius * Math.sin(radians)
  };
}

function buildPolygon(items: RadarItem[]) {
  return items
    .map((item, index) => {
      const angle = (360 / items.length) * index;
      const point = polarToCartesian(angle, (item.value / 100) * 42);
      return `${point.x},${point.y}`;
    })
    .join(" ");
}

export function ScoreRadar({
  title,
  items
}: {
  title: string;
  items: RadarItem[];
}) {
  const polygon = buildPolygon(items);

  return (
    <div className="score-card">
      <div className="record-title">{title}</div>
      <svg viewBox="0 0 120 120" className="radar-svg" aria-label={title}>
        {[
          { radius: 8.4, label: "20" },
          { radius: 16.8, label: "40" },
          { radius: 25.2, label: "60" },
          { radius: 33.6, label: "80" },
          { radius: 42, label: "100" }
        ].map((layer) => (
          <g key={layer.radius}>
            <circle
              cx="60"
              cy="60"
              r={layer.radius}
              fill="none"
              stroke="rgba(168, 132, 86, 0.18)"
              strokeWidth="1"
            />
            <text
              x="62"
              y={60 - layer.radius + 4}
              fontSize="4"
              fill="rgba(122, 97, 68, 0.72)"
            >
              {layer.label}
            </text>
          </g>
        ))}
        {items.map((item, index) => {
          const angle = (360 / items.length) * index;
          const point = polarToCartesian(angle, 42);
          return (
            <line
              key={item.label}
              x1="60"
              y1="60"
              x2={point.x}
              y2={point.y}
              stroke="rgba(168, 132, 86, 0.16)"
              strokeWidth="1"
            />
          );
        })}
        <polygon
          points={polygon}
          fill="rgba(202, 167, 114, 0.28)"
          stroke="rgba(157, 129, 98, 0.92)"
          strokeWidth="2"
        />
      </svg>
      <div className="radar-labels">
        {items.map((item) => (
          <div key={item.label} className="radar-label-row">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DimensionCard({
  label,
  detail
}: {
  label: string;
  detail: ResumeDimensionScore;
}) {
  return (
    <div className="soft-card">
      <div className="summary-row">
        <div className="record-title">{label}</div>
        <span className="pill">{detail.score}</span>
      </div>
      <p className="page-subtitle" style={{ marginTop: 10 }}>
        {detail.reason}
      </p>
      <div className="record-subtitle" style={{ marginTop: 10 }}>
        证据：{detail.evidence.join("；")}
      </div>
      <div className="record-subtitle" style={{ marginTop: 8 }}>
        建议：{detail.improvement}
      </div>
    </div>
  );
}

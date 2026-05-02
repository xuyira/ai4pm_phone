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

function buildLabelPosition(index: number, total: number, radius = 51) {
  const angle = (360 / total) * index;
  return polarToCartesian(angle, radius);
}

export function ScoreRadar({
  title,
  items,
  hideTitle = false,
  hideLegend = false
}: {
  title?: string;
  items: RadarItem[];
  hideTitle?: boolean;
  hideLegend?: boolean;
}) {
  const polygon = buildPolygon(items);

  return (
    <div className="score-card">
      {hideTitle ? null : <div className="record-title">{title}</div>}
      <svg viewBox="0 0 120 120" className="radar-svg" aria-label={title}>
        {[
          { radius: 8.4, label: "2" },
          { radius: 16.8, label: "4" },
          { radius: 25.2, label: "6" },
          { radius: 33.6, label: "8" },
          { radius: 42, label: "10" }
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
            <g key={item.label}>
              <line
                x1="60"
                y1="60"
                x2={point.x}
                y2={point.y}
                stroke="rgba(168, 132, 86, 0.16)"
                strokeWidth="1"
              />
              <text
                x={buildLabelPosition(index, items.length).x}
                y={buildLabelPosition(index, items.length).y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="4.2"
                fill="rgba(91, 69, 42, 0.92)"
              >
                {item.label}
              </text>
            </g>
          );
        })}
        <polygon
          points={polygon}
          fill="rgba(202, 167, 114, 0.28)"
          stroke="rgba(157, 129, 98, 0.92)"
          strokeWidth="2"
        />
      </svg>
      {hideLegend ? null : (
        <div className="radar-labels">
          {items.map((item) => (
            <div key={item.label} className="radar-label-row">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      )}
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

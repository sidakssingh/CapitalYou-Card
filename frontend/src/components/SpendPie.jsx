import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const PIE_COLORS = [
  '#0ea5e9',
  '#14b8a6',
  '#2563eb',
  '#c084fc',
  '#fb7185',
  '#f59e0b',
  '#10b981',
  '#22d3ee',
  '#f97316',
  '#a855f7',
];

const clampPercentage = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const describeArc = (x, y, radius, startAngle, endAngle) => {
  const startRadians = (Math.PI / 180) * startAngle;
  const endRadians = (Math.PI / 180) * endAngle;
  const startX = x + radius * Math.cos(startRadians);
  const startY = y + radius * Math.sin(startRadians);
  const endX = x + radius * Math.cos(endRadians);
  const endY = y + radius * Math.sin(endRadians);
  const largeArcFlag = endAngle - startAngle >= 180 ? 1 : 0;
  return `M ${x} ${y} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
};

const SpendPie = ({ categories }) => {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const radius = 160;
  const center = 170;

  const segments = useMemo(() => {
    let cursor = 0;
    const normalized = categories.map((category, index) => ({
      color: PIE_COLORS[index % PIE_COLORS.length],
      label: category.category,
      percentage: clampPercentage(category.percentage_of_spend),
    }));
    const total = normalized.reduce((sum, segment) => sum + segment.percentage, 0) || 1;

    return normalized.map((segment) => {
      const sliceAngle = (segment.percentage / total) * 360;
      const segmentInfo = {
        ...segment,
        startAngle: cursor,
        endAngle: cursor + sliceAngle,
        midAngle: cursor + sliceAngle / 2,
      };
      cursor += sliceAngle;
      return segmentInfo;
    });
  }, [categories]);

  const handlePointerEnter = (segment) => setHoveredSegment(segment);
  const handlePointerLeave = () => setHoveredSegment(null);

  return (
    <div className="relative flex flex-col items-center gap-6">
      <svg
        width={radius * 2 + 20}
        height={radius * 2 + 20}
        viewBox="0 0 340 340"
        className="cursor-pointer"
      >
        <circle cx={center} cy={center} r={radius + 10} fill="#0f172a" opacity={0.08} />
        {segments.map((segment) => (
          <path
            key={segment.label}
            d={describeArc(center, center, radius, segment.startAngle, segment.endAngle)}
            fill={segment.color}
            stroke="#fff"
            strokeWidth={2}
            onMouseEnter={() => handlePointerEnter(segment)}
            onMouseLeave={handlePointerLeave}
          />
        ))}
        <circle cx={center} cy={center} r={radius / 2} fill="#fff" />
      </svg>
      <motion.div
        key={hoveredSegment ? hoveredSegment.label : 'none'}
        className="pointer-events-none bg-white/90 border border-slate-200 rounded-2xl px-5 py-3 shadow-lg text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
      >
        {hoveredSegment ? (
          <>
            <p className="text-xs uppercase tracking-wide text-slate-500">Category</p>
            <p className="text-lg font-semibold text-slate-900">{hoveredSegment.label}</p>
            <p className="text-sm text-slate-500">
              {hoveredSegment.percentage.toFixed(1)}% of total spend
            </p>
          </>
        ) : (
          <p className="text-sm font-semibold text-slate-600">Hover to explore</p>
        )}
      </motion.div>
    </div>
  );
};

export default SpendPie;

"use client";

import React, { useState } from 'react';
import { useI18n } from '../../../providers/I18nProvider';

// Helper to convert polar coordinates to Cartesian for SVG path arcs
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', x, y,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z',
  ].join(' ');
}

export default function BranchStudyGroupPieCharts({ branchData = [] }) {
  const { t } = useI18n();
  const [hoveredSlice, setHoveredSlice] = useState(null);

  if (!branchData || branchData.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-manrope text-xl font-bold text-black dark:text-white">
            {t('admin.study_group_title')}
          </h2>
          <p className="text-xs text-stone-500 dark:text-neutral-400 mt-1">
            {t('admin.study_group_subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
        {branchData.map((branch) => {
          let cumulativeAngle = 0;
          const slicesWithAngles = (branch.slices || []).map((slice) => {
            const angle = (slice.percentage / 100) * 360;
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angle;
            cumulativeAngle += angle;
            return {
              ...slice,
              startAngle,
              endAngle,
            };
          });

          return (
            <div
              key={branch.branchId}
              className="bg-white dark:bg-neutral-800 rounded-3xl p-6 shadow-sm border border-stone-200/60 dark:border-neutral-700 flex flex-col justify-between"
            >
              {/* Branch Title & Total Hours */}
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-stone-100 dark:border-neutral-700">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-400 inline-block" />
                  <h3 className="font-hankenGrotesk text-lg font-bold text-black dark:text-white">
                    {branch.branchName} ({branch.branchShort})
                  </h3>
                </div>
                <span className="text-xs font-bold font-mono text-stone-600 dark:text-neutral-300 bg-stone-100 dark:bg-neutral-700 px-3 py-1 rounded-full">
                  {branch.totalHours} hrs total
                </span>
              </div>

              {/* Pie Chart & Legend Container */}
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* SVG Pie Chart */}
                <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                    {slicesWithAngles.map((slice) => {
                      const isHovered =
                        hoveredSlice?.branchId === branch.branchId &&
                        hoveredSlice?.sliceId === slice.id;

                      // Single item full circle edge case
                      if (slice.percentage >= 99.9) {
                        return (
                          <circle
                            key={slice.id}
                            cx="100"
                            cy="100"
                            r="85"
                            fill={slice.color}
                            className="transition-transform duration-200 cursor-pointer"
                            onMouseEnter={() =>
                              setHoveredSlice({ branchId: branch.branchId, sliceId: slice.id })
                            }
                            onMouseLeave={() => setHoveredSlice(null)}
                          />
                        );
                      }

                      // Ensure slice angles don't break if zero
                      if (slice.endAngle - slice.startAngle <= 0.01) return null;

                      const pathD = describeArc(100, 100, 85, slice.startAngle, slice.endAngle);

                      return (
                        <path
                          key={slice.id}
                          d={pathD}
                          fill={slice.color}
                          className={`transition-all duration-200 cursor-pointer origin-center ${
                            isHovered ? 'opacity-90 scale-105 stroke-2 stroke-white dark:stroke-neutral-800' : 'opacity-100'
                          }`}
                          onMouseEnter={() =>
                            setHoveredSlice({ branchId: branch.branchId, sliceId: slice.id })
                          }
                          onMouseLeave={() => setHoveredSlice(null)}
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* Legend List */}
                <div className="flex-1 w-full flex flex-col gap-2">
                  {branch.slices.map((slice) => {
                    const isHovered =
                      hoveredSlice?.branchId === branch.branchId &&
                      hoveredSlice?.sliceId === slice.id;

                    return (
                      <div
                        key={slice.id}
                        onMouseEnter={() =>
                          setHoveredSlice({ branchId: branch.branchId, sliceId: slice.id })
                        }
                        onMouseLeave={() => setHoveredSlice(null)}
                        className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer text-xs ${
                          isHovered
                            ? 'bg-stone-100 dark:bg-neutral-700/80 font-bold'
                            : 'hover:bg-stone-50 dark:hover:bg-neutral-700/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: slice.color }}
                          />
                          <span className="truncate font-hankenGrotesk text-stone-900 dark:text-neutral-100">
                            {slice.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                          <span className="text-stone-600 dark:text-neutral-300 font-semibold">
                            {slice.totalHours} hrs
                          </span>
                          <span className="text-stone-400 dark:text-neutral-500">
                            ({slice.percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

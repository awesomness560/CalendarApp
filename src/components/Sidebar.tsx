// Sidebar.tsx
import React from "react";
import type { DayData } from "../types";

// Configurable thresholds
const LOW_THRESHOLD = 3; // 1-3 total items = 1 dot
const MEDIUM_THRESHOLD = 7; // 4-7 total items = 2 dots
// 8+ total items = 3 dots

interface SidebarProps {
  days: DayData[];
  selectedDayIndex: number;
  onDaySelect: (index: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  days,
  selectedDayIndex,
  onDaySelect,
}) => {
  // Calculate density dots based on total events + tasks
  const getDensityDots = (dayData: DayData) => {
    const totalItems = dayData.events.length + dayData.tasks.length;

    if (totalItems <= LOW_THRESHOLD) return 1;
    if (totalItems <= MEDIUM_THRESHOLD) return 2;
    return 3;
  };

  // Format day for display (e.g., "Mon 19")
  const formatDay = (date: Date) => {
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const dayNumber = date.getDate();
    return `${dayName} ${dayNumber}`;
  };

  return (
    <div className="h-full bg-surface overflow-y-auto p-4 no-scrollbar">
      <div className="space-y-4">
        {days.map((dayData, index) => {
          const isSelected = index === selectedDayIndex;
          const densityDots = getDensityDots(dayData);

          return (
            <div
              key={dayData.date.toISOString()}
              onClick={() => onDaySelect(index)}
              className={`
                p-4 rounded-lg cursor-pointer transition-all duration-200
                ${isSelected ? "bg-primary" : "hover:bg-surface-hover"}
              `}
            >
              {/* Day Text */}
              <div
                className={`text-xl font-semibold text-center mb-3 ${
                  isSelected ? "text-ink" : "text-ink"
                }`}
              >
                {formatDay(dayData.date)}
              </div>

              {/* Density Dots */}
              <div className="flex justify-center gap-1 mb-3">
                {Array.from({ length: densityDots }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? "bg-ink" : "bg-primary"
                    }`}
                  />
                ))}
              </div>

              {/* Event/Task Count */}
              <div
                className={`text-sm text-center ${
                  isSelected ? "text-ink" : "text-ink-muted"
                }`}
              >
                {dayData.events.length} events, {dayData.tasks.length} tasks
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;

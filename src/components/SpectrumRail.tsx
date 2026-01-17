// components/SpectrumRail.tsx
import React from "react";
import type { DayData } from "../types";
import { getDayHue } from "../utils";

interface SpectrumRailProps {
  days: DayData[];
  onDayClick: (index: number) => void;
}

export const SpectrumRail: React.FC<SpectrumRailProps> = ({
  days,
  onDayClick,
}) => {
  return (
    <div className="w-[15%] h-full flex flex-col justify-between py-2 pr-2">
      {days.map((day, index) => {
        const hue = getDayHue(day.date);

        // Calculate Bulge: Base 8px + 4px per task, capped at 80px
        const width = Math.min(8 + day.taskCount * 4, 80);

        return (
          <div
            key={index}
            className="flex-1 flex items-center justify-end group cursor-pointer"
            onClick={() => onDayClick(index)}
          >
            <div
              className="rounded-l-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:brightness-110"
              style={{
                backgroundColor: `hsl(${hue}, 70%, 50%)`,
                width: `${width}px`,
                height: "85%", // 85% height leaves a small gap between days
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

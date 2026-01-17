// components/DayHeader.tsx
import React, { useState } from "react";
import { format } from "date-fns";
import type { DayData } from "../types";
import { getTimelineStyle } from "../utils";

interface DayHeaderProps {
  day: DayData;
}

export const DayHeader: React.FC<DayHeaderProps> = ({ day }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Dynamic Background
  const headerStyle = { backgroundColor: `hsl(${day.hue}, 60%, 25%)` };

  // Separate classes from special events
  const classes = day.events.filter((e) => e.type === "class");
  const specialEvents = day.events.filter((e) => e.type === "event");

  // Toggle expansion (force high res view on tap)
  const showHighRes = day.isHighRes || isExpanded;

  return (
    <div
      className="mb-4 rounded-md overflow-hidden shadow-sm select-none transition-all duration-300"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Main Header Bar */}
      <div className="h-14 flex items-center px-4 relative" style={headerStyle}>
        {/* Date */}
        <span className="font-bold text-xl mr-4 z-10 drop-shadow-md text-white">
          {format(day.date, "eee d")}
        </span>

        {/* --- STATE 1: TIMELINE (Visual Blocks) --- */}
        {showHighRes && (
          <div className="flex-1 h-full relative mx-2">
            {/* Base Line */}
            <div className="absolute top-1/2 w-full h-0.5 bg-white/10 -translate-y-1/2" />

            {/* Grey Blocks (Classes) */}
            {classes.map((c) => (
              <div
                key={c.id}
                className="absolute top-3 bottom-3 bg-gray-900/60 rounded-sm border border-white/5"
                style={getTimelineStyle(c.start, c.duration)}
              />
            ))}

            {/* White Blocks (Events) */}
            {specialEvents.map((e) => (
              <div
                key={e.id}
                className="absolute top-2 bottom-2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)] rounded-sm"
                style={getTimelineStyle(e.start, e.duration)}
              />
            ))}
          </div>
        )}

        {/* --- STATE 2: COMPACT TEXT (Future Days) --- */}
        {!showHighRes && specialEvents.length > 0 && (
          <span className="text-sm text-white/90 truncate flex-1 text-right font-medium">
            {specialEvents[0].title} @ {specialEvents[0].start}
          </span>
        )}
      </div>

      {/* Expanded Context Row (Only if expanded/highRes and has special events) */}
      {showHighRes && specialEvents.length > 0 && (
        <div className="px-4 py-2 bg-black/20 text-sm text-white/80">
          {specialEvents.map((e) => (
            <div key={e.id} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="font-mono opacity-70">{e.start}</span>
              <span>{e.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

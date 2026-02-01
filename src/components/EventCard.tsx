import React, { useMemo } from "react";
import type { CalendarEvent } from "../types";

interface EventCardProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}

// Parse 24h "HH:mm" and return 12h display string (e.g. "9:00 AM", "2:30 PM")
const formatTime12h = (time24: string): string => {
  const [hours, minutes] = time24.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Calculate end time from start "HH:mm" + duration (returns 24h "HH:mm")
const getEndTime = (startTime: string, durationMinutes: number): string => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  date.setMinutes(date.getMinutes() + durationMinutes);
  const h = date.getHours();
  const m = date.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  // Memoize end time calculation so it doesn't re-run unnecessarily
  const endTime = useMemo(() => {
    return getEndTime(event.start, event.duration);
  }, [event.start, event.duration]);

  // Determine colors based on event type
  const isClass = event.type === "class";
  const colorClasses = isClass
    ? "bg-event/30 hover:bg-event/30 border border-event border-l-4 border-l-event"
    : "bg-non-class-event/20 hover:bg-non-class-event/30 border border-non-class-event border-l-4 border-l-non-class-event";

  return (
    <div
      onClick={() => onClick?.(event)}
      className={`
        group
        relative
        flex flex-col justify-between
        w-full p-4 mb-3
        ${colorClasses}
        rounded-lg
        cursor-pointer
        transition-all duration-200
      `}
    >
      {/* Time Range - Top (12-hour format) */}
      <div className="text-xs text-ink-muted mb-2">
        {formatTime12h(event.start)} – {formatTime12h(endTime)}
      </div>

      {/* Event Title - Bottom */}
      <h3 className="text-ink font-medium text-base group-hover:text-white transition-colors">
        {event.title}
      </h3>
    </div>
  );
};

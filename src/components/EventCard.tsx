import React, { useMemo } from "react";
import type { CalendarEvent } from "../types";

interface EventCardProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}

// 2. Helper to calculate end time (e.g., "09:00" + 60min -> "10:00")
const getEndTime = (startTime: string, durationMinutes: number): string => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  date.setMinutes(date.getMinutes() + durationMinutes);

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  // Memoize end time calculation so it doesn't re-run unnecessarily
  const endTime = useMemo(() => {
    return getEndTime(event.start, event.duration);
  }, [event.start, event.duration]);

  // Determine colors based on event type
  const isClass = event.type === "class";
  const colorClasses = isClass
    ? "bg-event/20 hover:bg-event/30 border border-event border-l-4 border-l-event"
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
      {/* Time Range - Top */}
      <div className="text-xs text-ink-muted mb-2">
        {event.start} - {endTime}
      </div>

      {/* Event Title - Bottom */}
      <h3 className="text-ink font-medium text-base group-hover:text-white transition-colors">
        {event.title}
      </h3>
    </div>
  );
};

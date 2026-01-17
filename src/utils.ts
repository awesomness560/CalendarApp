// utils.ts
import { differenceInDays, startOfDay } from "date-fns";

export const getDayHue = (date: Date): number => {
  const today = startOfDay(new Date());
  const diff = differenceInDays(date, today);
  // Base 30 (Orange) -> +16 per day -> Ends Purple
  return 30 + diff * 16;
};

export const getTimelineStyle = (
  startTime: string,
  durationMinutes: number,
): React.CSSProperties => {
  const dayStartHour = 8; // 8:00 AM
  const totalHours = 14; // 8 AM to 10 PM window

  const [h, m] = startTime.split(":").map(Number);
  const startDecimal = h + m / 60;

  const leftPercent = ((startDecimal - dayStartHour) / totalHours) * 100;
  const widthPercent = (durationMinutes / 60 / totalHours) * 100;

  return {
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
  };
};

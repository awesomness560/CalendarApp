// data.ts
import { addDays, format, startOfDay } from "date-fns";
import type { DayData, Task, CalendarEvent } from "./types";
import { getDayHue } from "./utils";

const generateDummyData = (): DayData[] => {
  const today = startOfDay(new Date());
  const days: DayData[] = [];

  for (let i = 0; i < 14; i++) {
    const currentDate = addDays(today, i);
    const dateString = format(currentDate, "yyyy-MM-dd");
    const isHighRes = i < 2; // Only Today (0) and Tomorrow (1) get the timeline

    // 1. Mock Events (Classes & Special)
    const events: CalendarEvent[] = [];

    // Add Classes (Only on weekdays)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Mon-Fri
      events.push({
        id: `class-${i}-1`,
        title: "CS 101: Algo",
        type: "class",
        start: "09:00",
        duration: 90,
      });
      events.push({
        id: `class-${i}-2`,
        title: "Math 202",
        type: "class",
        start: "13:00",
        duration: 60,
      });
    }

    // Add Special Events (Randomly)
    if (Math.random() > 0.7) {
      events.push({
        id: `event-${i}`,
        title: "Club Meeting",
        type: "event",
        start: "17:00",
        duration: 60,
      });
    }

    // 2. Mock Tasks
    const tasks: Task[] = [];
    const numTasks = Math.floor(Math.random() * 5) + 1; // 1 to 5 tasks per day

    // Simulate a "Heavy Day" on day 4
    const count = i === 4 ? 12 : numTasks;

    for (let j = 0; j < count; j++) {
      tasks.push({
        id: `task-${i}-${j}`,
        title:
          i === 4
            ? `Project Component ${j + 1}`
            : `Task ${j + 1} for ${format(currentDate, "EEE")}`,
        notes:
          Math.random() > 0.5
            ? "Check the rubric before submitting."
            : undefined,
        isCompleted: false,
        dueDate: dateString,
        time: Math.random() > 0.8 ? "14:00" : undefined, // Occasional specific time
      });
    }

    days.push({
      date: currentDate,
      isHighRes,
      hue: getDayHue(currentDate),
      events,
      tasks,
      taskCount: tasks.length,
    });
  }

  return days;
};

export const DUMMY_DATA = generateDummyData();

// types.ts

export type EventType = "class" | "event";

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  start: string; // "HH:MM" format (24h)
  duration: number; // in minutes
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  isCompleted: boolean;
  time?: string; // Optional due time "HH:MM"
  dueDate: string; // ISO Date string YYYY-MM-DD
}

export interface DayData {
  date: Date;
  isHighRes: boolean; // True for Today/Tomorrow
  hue: number; // Calculated color value
  events: CalendarEvent[];
  tasks: Task[];
  taskCount: number; // For the rail bulge calculation
}

// googleService.ts
import {
  addDays,
  startOfDay,
  endOfDay,
  format,
  differenceInMinutes,
  parseISO,
  isSameDay,
} from "date-fns";
import type { DayData, CalendarEvent, Task, EventType } from "../types";

// ==========================================
// CONFIGURATION
// ==========================================

// Add the IDs of the calendars that contain your Classes here.
// You can find these IDs in Google Calendar Settings > [Calendar Name] > Integrate Calendar > Calendar ID
const CLASS_CALENDAR_IDS = [
  "5dd961a168ab8deb9b3d7450c0ca2fb2f343fb306c6fa868d012482e09f77e55@group.calendar.google.com",
  // "primary" // Uncomment if your primary calendar is purely classes
];

export const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/tasks",
].join(" ");

// ==========================================
// API FETCHING LOGIC
// ==========================================

/**
 * Fetches data for today + next 14 days
 */
export const fetchGoogleData = async (
  accessToken: string,
): Promise<DayData[]> => {
  console.log("🚀 Starting Google data fetch...");
  console.log("📅 Access token:", accessToken ? "✅ Present" : "❌ Missing");

  const today = startOfDay(new Date());
  const endDate = endOfDay(addDays(today, 13)); // Today + 13 days = 14 days total

  console.log("📅 Date range:", {
    start: format(today, "yyyy-MM-dd"),
    end: format(endDate, "yyyy-MM-dd"),
    totalDays: 14,
  });

  // 1. Initialize the 14-day array structure
  const days: DayData[] = Array.from({ length: 14 }).map((_, i) => ({
    date: addDays(today, i),
    events: [],
    tasks: [],
  }));

  console.log(
    "📊 Initialized days structure:",
    days.map((d) => format(d.date, "yyyy-MM-dd")),
  );

  try {
    // 2. Fetch Calendars and Tasks in parallel
    console.log("🔄 Fetching calendar events and tasks in parallel...");
    const [calendarEvents, tasks] = await Promise.all([
      fetchCalendarEvents(accessToken, today, endDate),
      fetchTasks(accessToken, today, endDate),
    ]);

    console.log("📅 Raw calendar events fetched:", calendarEvents.length);
    console.log("📋 Raw tasks fetched:", tasks.length);

    if (calendarEvents.length > 0) {
      console.log("📅 Sample calendar event:", calendarEvents[0]);
    }

    if (tasks.length > 0) {
      console.log("📋 Sample task:", tasks[0]);
      console.log(
        "📋 All tasks with due dates:",
        tasks.map((t) => ({
          title: t.title,
          due: t.due,
          status: t.status,
        })),
      );
    }

    // Filter tasks to our date range (client-side filtering)
    const filteredTasks = tasks.filter((task) => {
      if (!task.due) return false;

      // Google Tasks due dates are stored as UTC midnight but should be treated as date-only
      // Extract just the date part (YYYY-MM-DD) and create a local date
      const dueDateString = task.due.split("T")[0]; // Extract "2026-01-18" from "2026-01-18T00:00:00.000Z"
      const taskDueDateLocal = parseISO(dueDateString); // Parse as local date without time
      const todayLocal = startOfDay(today);
      const endDateLocal = startOfDay(endDate);

      const isInRange =
        taskDueDateLocal >= todayLocal && taskDueDateLocal <= endDateLocal;

      console.log(`📋 Task range check:`, {
        title: task.title,
        due: task.due,
        dueDateString,
        taskDueDateLocal: format(taskDueDateLocal, "yyyy-MM-dd"),
        todayLocal: format(todayLocal, "yyyy-MM-dd"),
        endDateLocal: format(endDateLocal, "yyyy-MM-dd"),
        isInRange,
      });

      return isInRange;
    });

    console.log(
      `📋 Tasks after date filtering: ${filteredTasks.length} (from ${tasks.length} total)`,
    );

    // 3. Map fetched data to the specific days
    days.forEach((day) => {
      const dayStr = format(day.date, "yyyy-MM-dd");

      // Filter events for this day
      day.events = calendarEvents
        .filter((event) =>
          // We check if the event starts on this day
          isSameDay(parseISO(event.originalStartDateTime), day.date),
        )
        .map(formatCalendarEvent);

      // Filter tasks for this day
      day.tasks = filteredTasks
        .filter((task) => {
          if (!task.due) return false;

          // Extract date part and parse as local date (no timezone conversion)
          const dueDateString = task.due.split("T")[0]; // Extract "2026-01-18" from "2026-01-18T00:00:00.000Z"
          const taskDueDateLocal = parseISO(dueDateString);
          const dayLocal = startOfDay(day.date);
          const isMatch = taskDueDateLocal.getTime() === dayLocal.getTime();

          console.log(`📋 Task filtering for ${dayStr}:`, {
            taskTitle: task.title,
            taskDue: task.due,
            dueDateString,
            taskDueDateLocal: format(taskDueDateLocal, "yyyy-MM-dd"),
            dayLocal: format(dayLocal, "yyyy-MM-dd"),
            isMatch,
          });

          return isMatch;
        })
        .map(formatTask);

      if (day.events.length > 0 || day.tasks.length > 0) {
        console.log(`📅 Day ${dayStr}:`, {
          events: day.events.length,
          tasks: day.tasks.length,
          eventsData: day.events,
          tasksData: day.tasks,
        });
      }
    });

    const totalEvents = days.reduce((sum, day) => sum + day.events.length, 0);
    const totalTasks = days.reduce((sum, day) => sum + day.tasks.length, 0);

    console.log("✅ Google data fetch completed successfully!");
    console.log("📊 Final summary:", {
      totalEvents,
      totalTasks,
      daysWithData: days.filter(
        (d) => d.events.length > 0 || d.tasks.length > 0,
      ).length,
    });

    return days;
  } catch (error) {
    console.error("❌ Error fetching Google data:", error);
    throw error;
  }
};

// --- Calendar Helpers ---

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  organizer?: { email: string };
  originalStartDateTime: string; // Helper property we add for sorting
}

async function fetchCalendarEvents(
  token: string,
  start: Date,
  end: Date,
): Promise<GoogleCalendarEvent[]> {
  console.log("📅 Fetching calendar events...");

  // Fetch list of calendars to check against CLASS_CALENDAR_IDS (Optional, primarily we query 'primary' or all)
  // For simplicity, we will query the user's "primary" calendar.
  // If you need events from ALL calendars, you must first list calendars, then loop through them.
  // Below fetches from PRIMARY. To fetch others, loop through calendarList.list.

  const calendarsToFetch = [
    "primary",
    ...CLASS_CALENDAR_IDS.filter((id) => id !== "primary"),
  ];
  // Remove duplicates
  const uniqueCalendars = [...new Set(calendarsToFetch)];

  console.log("📅 Calendars to fetch from:", uniqueCalendars);

  const allEvents: GoogleCalendarEvent[] = [];

  for (const calendarId of uniqueCalendars) {
    try {
      console.log(`📅 Fetching from calendar: ${calendarId}`);

      const params = new URLSearchParams({
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        singleEvents: "true", // Expand recurring events
        orderBy: "startTime",
      });

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      console.log(
        `📅 Calendar ${calendarId} response status:`,
        response.status,
      );

      if (!response.ok) {
        console.warn(
          `⚠️ Failed to fetch calendar ${calendarId}:`,
          response.status,
          response.statusText,
        );
        continue;
      }

      const data = await response.json();
      const events = (data.items || []).map((item: any) => ({
        ...item,
        // Tag the event with the source calendar ID so we can identify "classes" later
        sourceCalendarId: calendarId,
        originalStartDateTime: item.start.dateTime || item.start.date,
      }));

      console.log(`📅 Found ${events.length} events in calendar ${calendarId}`);
      if (events.length > 0) {
        console.log(`📅 Sample event from ${calendarId}:`, events[0]);
      }

      allEvents.push(...events);
    } catch (error) {
      console.error(`❌ Error fetching calendar ${calendarId}:`, error);
    }
  }

  console.log(`📅 Total calendar events fetched: ${allEvents.length}`);
  return allEvents;
}

function formatCalendarEvent(item: any): CalendarEvent {
  const isAllDay = !item.start.dateTime;
  const startDt = parseISO(item.start.dateTime || item.start.date);
  const endDt = parseISO(item.end.dateTime || item.end.date);

  // Determine Type
  let type: EventType = "event";
  if (CLASS_CALENDAR_IDS.includes(item.sourceCalendarId)) {
    type = "class";
  }

  const formatted = {
    id: item.id,
    title: item.summary || "No Title",
    type: type,
    start: isAllDay ? "00:00" : format(startDt, "HH:mm"),
    duration: differenceInMinutes(endDt, startDt),
  };

  console.log("📅 Formatted calendar event:", {
    original: {
      summary: item.summary,
      start: item.start,
      end: item.end,
      sourceCalendarId: item.sourceCalendarId,
    },
    formatted,
  });

  return formatted;
}

// --- Task Helpers ---

interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: string;
  due?: string; // YYYY-MM-DD
}

async function fetchTasks(
  token: string,
  start: Date,
  end: Date,
): Promise<GoogleTask[]> {
  console.log("📋 Fetching tasks...");

  const allTasks: GoogleTask[] = [];

  try {
    // 1. Get all task lists
    console.log("📋 Fetching task lists...");
    const listsResponse = await fetch(
      "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
      { headers: { Authorization: `Bearer ${token}` } },
    );

    console.log("📋 Task lists response status:", listsResponse.status);

    if (!listsResponse.ok) {
      console.warn(
        "⚠️ Failed to fetch task lists:",
        listsResponse.status,
        listsResponse.statusText,
      );
      return [];
    }

    const listsData = await listsResponse.json();
    const taskLists = listsData.items || [];

    console.log(
      `📋 Found ${taskLists.length} task lists:`,
      taskLists.map((list: any) => list.title),
    );

    // 2. Fetch tasks for each list
    // Note: We'll fetch all tasks and filter client-side since Google Tasks due dates
    // are date-only but the API expects RFC3339 timestamps for filtering
    const params = new URLSearchParams({
      showCompleted: "true",
      showHidden: "true",
      // Removed dueMin/dueMax to avoid timezone issues - we'll filter client-side
    });

    console.log("📋 Task query parameters:", {
      ...Object.fromEntries(params),
      note: "Fetching all tasks, will filter client-side",
      targetStartDate: format(start, "yyyy-MM-dd"),
      targetEndDate: format(end, "yyyy-MM-dd"),
    });

    for (const list of taskLists) {
      try {
        console.log(`📋 Fetching tasks from list: ${list.title} (${list.id})`);

        const response = await fetch(
          `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?${params}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        console.log(`📋 Tasks response for ${list.title}:`, response.status);

        if (!response.ok) {
          console.warn(
            `⚠️ Failed to fetch tasks from ${list.title}:`,
            response.status,
          );
          continue;
        }

        const data = await response.json();
        const tasks = data.items || [];

        console.log(`📋 Found ${tasks.length} tasks in ${list.title}`);
        if (tasks.length > 0) {
          console.log(`📋 Sample task from ${list.title}:`, tasks[0]);
        }

        if (data.items) {
          allTasks.push(...data.items);
        }
      } catch (error) {
        console.error(`❌ Error fetching tasks for list ${list.title}:`, error);
      }
    }
  } catch (error) {
    console.error("❌ Error in fetchTasks:", error);
  }

  console.log(`📋 Total tasks fetched: ${allTasks.length}`);
  return allTasks;
}

function formatTask(item: GoogleTask): Task {
  const formatted = {
    id: item.id,
    title: item.title,
    notes: item.notes,
    isCompleted: item.status === "completed",
    dueDate: item.due ? item.due.split("T")[0] : "", // Extract YYYY-MM-DD
    time: undefined, // Google Tasks API does not provide time in 'due' field
  };

  console.log("📋 Formatted task:", {
    original: {
      title: item.title,
      status: item.status,
      due: item.due,
      notes: item.notes,
    },
    formatted,
    dueDateExtracted: formatted.dueDate,
  });

  return formatted;
}

// ==========================================
// TASK COMPLETION API
// ==========================================

/**
 * Marks a task as completed in Google Tasks
 */
export const completeTask = async (
  accessToken: string,
  taskListId: string,
  taskId: string,
): Promise<void> => {
  console.log("✅ Marking task as complete:", { taskListId, taskId });

  try {
    const response = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "completed",
        }),
      },
    );

    console.log("✅ Complete task response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Failed to complete task:", response.status, errorText);
      throw new Error(
        `Failed to complete task: ${response.status} ${errorText}`,
      );
    }

    const updatedTask = await response.json();
    console.log("✅ Task marked as complete:", updatedTask);
  } catch (error) {
    console.error("❌ Error completing task:", error);
    throw error;
  }
};

/**
 * Helper to find which task list a task belongs to
 * This is needed because we need the taskListId to complete a task
 */
export const findTaskListForTask = async (
  accessToken: string,
  taskId: string,
): Promise<string | null> => {
  console.log("🔍 Finding task list for task:", taskId);

  try {
    // Get all task lists
    const listsResponse = await fetch(
      "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!listsResponse.ok) {
      console.warn("⚠️ Failed to fetch task lists for task lookup");
      return null;
    }

    const listsData = await listsResponse.json();
    const taskLists = listsData.items || [];

    // Search through each task list to find the task
    for (const list of taskLists) {
      try {
        const tasksResponse = await fetch(
          `https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          const tasks = tasksData.items || [];

          if (tasks.some((task: any) => task.id === taskId)) {
            console.log("✅ Found task in list:", list.title, list.id);
            return list.id;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error searching in task list ${list.title}:`, error);
      }
    }

    console.warn("⚠️ Task not found in any list:", taskId);
    return null;
  } catch (error) {
    console.error("❌ Error finding task list:", error);
    return null;
  }
};

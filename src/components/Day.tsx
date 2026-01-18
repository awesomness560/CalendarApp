// Day.tsx
import React, { useState } from "react";
import type { DayData } from "../types";
import { EventCard } from "./EventCard";
import { TaskCard } from "./Task";

interface DayProps {
  dayData: DayData;
}

const Day: React.FC<DayProps> = ({ dayData }) => {
  // State for managing expanded tasks
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Format the date to show day name and date (e.g., "Mon 19")
  const formatDay = (date: Date) => {
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const dayNumber = date.getDate();
    return `${dayName} ${dayNumber}`;
  };

  // Handle task expansion toggle
  const handleToggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Handle task completion
  const handleComplete = (taskId: string) => {
    // In a real app, this would update the task's completion status
    console.log(`Completing task: ${taskId}`);
    // For now, just collapse the task
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  };

  return (
    <div className="p-6">
      {/* Large Day Text */}
      <h1 className="text-4xl font-bold text-ink mb-8">
        {formatDay(dayData.date)}
      </h1>

      {/* Schedule Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-ink mb-4">Schedule</h2>
        <div className="grid grid-cols-3 gap-4">
          {dayData.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>

      {/* Tasks Section */}
      <div>
        <h2 className="text-xl font-semibold text-ink mb-4">Tasks</h2>
        <div className="space-y-3">
          {dayData.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isExpanded={expandedTasks.has(task.id)}
              onToggleExpand={handleToggleExpand}
              onComplete={handleComplete}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Day;

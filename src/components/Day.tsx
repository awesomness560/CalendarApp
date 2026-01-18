// Day.tsx
import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import { useCompleteTask } from "../hooks/useGoogleData";
import type { DayData } from "../types";
import { EventCard } from "./EventCard";
import { TaskCard } from "./Task";

interface DayProps {
  dayData: DayData;
  accessToken?: string;
}

const Day: React.FC<DayProps> = ({ dayData, accessToken }) => {
  // State for managing expanded tasks
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  // State for tracking tasks being removed (for animation)
  const [removingTasks, setRemovingTasks] = useState<Set<string>>(new Set());

  // Mutation for completing tasks
  const completeTaskMutation = useCompleteTask();

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
  const handleComplete = async (taskId: string) => {
    if (!accessToken) {
      console.warn("⚠️ No access token available for task completion");
      return;
    }

    try {
      // Add to removing tasks for animation
      setRemovingTasks((prev) => new Set([...prev, taskId]));

      // Complete the task via API
      await completeTaskMutation.mutateAsync({
        accessToken,
        taskId,
      });

      console.log(`✅ Task completed: ${taskId}`);

      // Remove from expanded tasks
      setExpandedTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });

      // Remove from removing tasks after animation completes
      setTimeout(() => {
        setRemovingTasks((prev) => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }, 300); // Match the exit animation duration
    } catch (error) {
      console.error("❌ Failed to complete task:", error);

      // Remove from removing tasks on error
      setRemovingTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
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
          <AnimatePresence mode="popLayout">
            {dayData.tasks
              .filter((task) => !task.isCompleted) // Only show incomplete tasks
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isExpanded={expandedTasks.has(task.id)}
                  onToggleExpand={handleToggleExpand}
                  onComplete={handleComplete}
                  isCompleting={
                    completeTaskMutation.isPending && removingTasks.has(task.id)
                  }
                />
              ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Day;

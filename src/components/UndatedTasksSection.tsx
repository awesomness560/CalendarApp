// UndatedTasksSection.tsx
import React, { useState } from "react";
import { AnimatePresence } from "motion/react";
import { useCompleteTask } from "../hooks/useGoogleData";
import type { Task } from "../types";
import { TaskCard } from "./Task";

interface UndatedTasksSectionProps {
  tasks: Task[];
  accessToken?: string;
}

const UndatedTasksSection: React.FC<UndatedTasksSectionProps> = ({
  tasks,
  accessToken,
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [removingTasks, setRemovingTasks] = useState<Set<string>>(new Set());

  const completeTaskMutation = useCompleteTask();

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

  const handleComplete = async (taskId: string) => {
    if (!accessToken) {
      console.warn("⚠️ No access token available for task completion");
      return;
    }

    try {
      setRemovingTasks((prev) => new Set([...prev, taskId]));

      await completeTaskMutation.mutateAsync({
        accessToken,
        taskId,
      });

      setExpandedTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });

      setTimeout(() => {
        setRemovingTasks((prev) => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }, 300);
    } catch (error) {
      console.error("❌ Failed to complete task:", error);
      setRemovingTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const incompleteTasks = tasks.filter((task) => !task.isCompleted);

  return (
    <div className="p-6 border-b border-gray-200/50">
      <h1 className="text-4xl font-bold text-ink mb-2">No date</h1>
      <p className="text-ink-muted text-sm mb-6">
        Tasks without a due date
      </p>

      <h2 className="text-xl font-semibold text-ink mb-4">Tasks</h2>
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {incompleteTasks.map((task) => (
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
  );
};

export default UndatedTasksSection;

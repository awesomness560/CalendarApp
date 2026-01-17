// components/TaskCard.tsx
import React, { useState, useEffect } from "react";
import type { Task } from "../types";

interface TaskCardProps {
  task: Task;
  hue: number;
  onComplete: (id: string) => void;
}

type TaskStatus = "idle" | "selected" | "completed";

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  hue,
  onComplete,
}) => {
  const [status, setStatus] = useState<TaskStatus>("idle");

  // Auto-deselect after 15 seconds
  useEffect(() => {
    let timer: number;
    if (status === "selected") {
      timer = window.setTimeout(() => setStatus("idle"), 15000);
    }
    return () => clearTimeout(timer);
  }, [status]);

  const handleTap = () => {
    if (status === "idle") {
      setStatus("selected");
    } else if (status === "selected") {
      setStatus("completed");
      setTimeout(() => onComplete(task.id), 300); // Delay for animation
    }
  };

  if (status === "completed") return null;

  return (
    <div
      onClick={handleTap}
      className={`
        relative mb-3 p-4 rounded-lg shadow-md transition-all duration-300 transform
        border-r-[6px] cursor-pointer select-none
        ${status === "selected" ? "bg-green-600 scale-[1.02]" : "bg-[#262636] active:scale-95"}
      `}
      style={{
        borderColor:
          status === "selected" ? "#22c55e" : `hsl(${hue}, 70%, 50%)`,
      }}
    >
      <div className="flex justify-between items-start">
        <h3
          className={`font-semibold text-lg leading-tight ${status === "selected" ? "text-white" : "text-gray-100"}`}
        >
          {task.title}
        </h3>
        {task.time && status === "idle" && (
          <span className="text-sm font-mono text-gray-400 bg-black/20 px-2 rounded">
            {task.time}
          </span>
        )}
      </div>

      {/* Details Reveal */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${status === "selected" ? "max-h-20 mt-2 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <p className="text-sm text-green-100">
          {task.notes || "No notes provided."}
        </p>
        <p className="text-[10px] mt-2 uppercase tracking-wider font-bold text-white/60">
          Tap again to complete
        </p>
      </div>
    </div>
  );
};

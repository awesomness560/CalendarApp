import React from "react";
import { motion } from "motion/react";
import type { Task } from "../types";

interface TaskCardProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onComplete: (id: string) => void;
  isCompleting?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isExpanded,
  onToggleExpand,
  onComplete,
  isCompleting = false,
}) => {
  // Handle the interaction logic based on state
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling

    if (isExpanded) {
      // If already open, the main tap action is to COMPLETE
      onComplete(task.id);
    } else {
      // If closed, the tap action is to EXPAND
      onToggleExpand(task.id);
    }
  };

  const handleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger the "Complete" action
    onToggleExpand(task.id); // Just toggle closed
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.8,
        x: 100,
        transition: {
          duration: 0.3,
          ease: "easeInOut",
        },
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
      className={`
        relative w-full rounded-lg transition-all duration-300 ease-in-out cursor-pointer overflow-hidden 
        ${
          isExpanded
            ? "bg-surface shadow-xl scale-[1.02] border border-surface-active border-l-4 border-l-surface-active py-5 px-5" // Expanded Styles
            : "bg-surface border border-surface-hover border-l-4 border-l-surface-hover py-4 px-4" // Normal Styles
        }
        ${isCompleting ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {/* --- Top Row: Title & Chevron --- */}
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h3
            className={`font-medium text-lg transition-colors text-ink ${isExpanded ? "font-bold" : ""}`}
          >
            {task.title}
          </h3>

          {/* Time Badge - Below title */}
          {task.time && (
            <span
              className={`text-sm font-mono transition-colors block mt-1 ${isExpanded ? "text-primary" : "text-ink-muted"}`}
            >
              {task.time}
            </span>
          )}
        </div>

        {/* Always visible chevron */}
        <button
          onClick={handleCollapse}
          className="p-2 text-ink-muted hover:text-ink rounded-full hover:bg-white/10 transition-colors shrink-0"
          aria-label={isExpanded ? "Collapse card" : "Expand card"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${isExpanded ? "" : "rotate-180"}`}
          >
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      </div>

      {/* --- Expanded Content (Notes & Action Prompt) --- */}
      <div
        className={`transition-all duration-300 overflow-hidden ${isExpanded ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0"}`}
      >
        {/* Notes Section */}
        {task.notes && (
          <p className="text-ink-muted text-sm leading-relaxed mb-4 border-l-2 border-white/10 pl-3">
            {task.notes}
          </p>
        )}

        {/* The "Tap Again" Prompt */}
        <div className="flex items-center gap-2 text-surface-active text-sm font-semibold animate-pulse mt-4">
          <motion.span
            className="w-4 h-4 rounded-full border-2 border-surface-active"
            animate={isCompleting ? { rotate: 360 } : {}}
            transition={{
              duration: 1,
              repeat: isCompleting ? Infinity : 0,
              ease: "linear",
            }}
          />
          {isCompleting ? "Completing..." : "Tap again to complete"}
        </div>
      </div>
    </motion.div>
  );
};

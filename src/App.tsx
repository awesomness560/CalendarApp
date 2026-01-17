// App.tsx
import React, { useRef, useState } from "react";
import { DUMMY_DATA } from "./data";
import { DayHeader } from "./components/DayHeader";
import { TaskCard } from "./components/TaskCard";
import { SpectrumRail } from "./components/SpectrumRail";

const App: React.FC = () => {
  // In a real app, this would be state fetched from API
  const [days, setDays] = useState(DUMMY_DATA);

  // Refs for scrolling
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleScrollToDay = (index: number) => {
    dayRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleCompleteTask = (taskId: string) => {
    // Optimistic Update: Remove task from state
    setDays((prevDays) =>
      prevDays.map((day) => ({
        ...day,
        tasks: day.tasks.filter((t) => t.id !== taskId),
        taskCount: day.tasks.filter((t) => t.id !== taskId).length,
      })),
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#1E1E2E] text-[#CDD6F4] font-sans">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#45475a 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* Main Layout */}
      <div className="z-10 flex w-full h-full relative">
        {/* Left: Task Feed */}
        <div className="flex-1 h-full overflow-y-auto no-scrollbar p-4 pl-6">
          <div className="max-w-3xl mx-auto">
            {days.map((day, index) => (
              <div
                key={day.date.toISOString()}
                ref={(el) => {
                  if (el !== null) {
                    dayRefs.current[index] = el;
                  }
                }}
                className="mb-8 scroll-mt-4"
              >
                <DayHeader day={day} />

                <div className="pl-2">
                  {day.tasks.length === 0 && (
                    <div className="text-white/20 text-sm italic py-2">
                      No tasks planned
                    </div>
                  )}
                  {day.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      hue={day.hue}
                      onComplete={handleCompleteTask}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="h-32" /> {/* Bottom spacer */}
          </div>
        </div>

        {/* Right: Spectrum Rail */}
        <SpectrumRail days={days} onDayClick={handleScrollToDay} />
      </div>
    </div>
  );
};

export default App;

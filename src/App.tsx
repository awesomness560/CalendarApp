// App.tsx
import React, { useState, useRef, useEffect } from "react";
import { DUMMY_DATA } from "./data";
import Day from "./components/Day";
import Sidebar from "./components/Sidebar";

const App: React.FC = () => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrollingFromClick = useRef(false);

  const handleDaySelect = (index: number) => {
    setSelectedDayIndex(index);
    isScrollingFromClick.current = true;

    // Scroll to the selected day
    const dayElement = dayRefs.current[index];
    if (dayElement && mainContentRef.current) {
      dayElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Reset flag after scroll completes
      setTimeout(() => {
        isScrollingFromClick.current = false;
      }, 1000);
    }
  };

  // Handle scroll to update active sidebar item
  useEffect(() => {
    const handleScroll = () => {
      if (!mainContentRef.current || isScrollingFromClick.current) return;

      // Find which day is most visible
      let activeIndex = 0;
      let maxVisibility = 0;

      dayRefs.current.forEach((dayElement, index) => {
        if (!dayElement) return;

        const rect = dayElement.getBoundingClientRect();
        const containerRect = mainContentRef.current!.getBoundingClientRect();

        // Calculate how much of the day is visible
        const visibleTop = Math.max(rect.top, containerRect.top);
        const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const visibility = visibleHeight / rect.height;

        if (visibility > maxVisibility) {
          maxVisibility = visibility;
          activeIndex = index;
        }
      });

      if (activeIndex !== selectedDayIndex) {
        setSelectedDayIndex(activeIndex);
      }
    };

    const mainContent = mainContentRef.current;
    if (mainContent) {
      mainContent.addEventListener("scroll", handleScroll);
      return () => mainContent.removeEventListener("scroll", handleScroll);
    }
  }, [selectedDayIndex]);

  return (
    <div className="flex h-screen w-screen no-scrollbar">
      {/* Sidebar - 20% width */}
      <div className="w-[20%] bg-surface">
        <Sidebar
          days={DUMMY_DATA}
          selectedDayIndex={selectedDayIndex}
          onDaySelect={handleDaySelect}
        />
      </div>

      {/* Main Content - 80% width */}
      <div
        ref={mainContentRef}
        className="w-[80%] bg-canvas overflow-y-auto no-scrollbar"
      >
        {DUMMY_DATA.map((dayData, index) => (
          <div
            key={dayData.date.toISOString()}
            ref={(el) => {
              dayRefs.current[index] = el;
            }}
          >
            <Day dayData={dayData} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;

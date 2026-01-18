// App.tsx
import React from "react";
import { DUMMY_DATA } from "./data";
import Day from "./components/Day";

const App: React.FC = () => {
  return (
    <div className="flex h-screen w-screen">
      {/* Sidebar - 10% width */}
      <div className="w-[20%] bg-surface"></div>

      {/* Main Content - 90% width */}
      <div className="w-[80%] bg-canvas overflow-y-auto">
        {DUMMY_DATA.map((dayData) => (
          <Day key={dayData.date.toISOString()} dayData={dayData} />
        ))}
      </div>
    </div>
  );
};

export default App;

import React from "react";

const Homepage: React.FC = () => {
  return (
    <div className="flex h-screen">
      {/* Zone A: The Task Feed (85%) */}
      <div className="w-[85%] overflow-y-auto bg-gray-50">Task Feed</div>

      {/* Zone B: The Spectrum Rail (15%) */}
      <div className="w-[15%] overflow-y-auto bg-blue-50 border-l border-gray-200">
        Spectrum Rail
      </div>
    </div>
  );
};

export default Homepage;

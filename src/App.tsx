// App.tsx
import React, { useState, useRef, useEffect } from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { DUMMY_DATA } from "./data";
import { fetchGoogleData, SCOPES } from "./logic/googleService";
import type { DayData } from "./types";
import Day from "./components/Day";
import Sidebar from "./components/Sidebar";

const App: React.FC = () => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string>("");
  const [googleData, setGoogleData] = useState<DayData[]>(DUMMY_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const mainContentRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrollingFromClick = useRef(false);

  // Google Login
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("🔐 Google login successful:", tokenResponse);
      setAccessToken(tokenResponse.access_token);
      setIsAuthenticated(true);
      setError("");

      // Fetch Google data immediately after login
      await fetchData(tokenResponse.access_token);
    },
    onError: (error) => {
      console.error("❌ Google login failed:", error);
      setError("Failed to sign in with Google");
    },
    scope: SCOPES,
  });

  // Fetch Google data
  const fetchData = async (token: string = accessToken) => {
    if (!token) {
      console.warn("⚠️ No access token available for data fetch");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("🔄 Starting data fetch...");
      const data = await fetchGoogleData(token);
      setGoogleData(data);
      console.log("✅ Data fetch completed, updating UI with:", data);
    } catch (err) {
      console.error("❌ Failed to fetch Google data:", err);
      setError("Failed to fetch Google data. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    console.log("🔐 Logging out...");
    googleLogout();
    setIsAuthenticated(false);
    setAccessToken("");
    setGoogleData(DUMMY_DATA);
    setError("");
  };

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
    <div className="flex h-screen w-screen overflow-hidden no-scrollbar">
      {/* Sidebar - 20% width */}
      <div className="w-[20%] bg-surface flex flex-col">
        {!isAuthenticated && (
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="space-y-2">
              <button
                onClick={() => login()}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in with Google"}
              </button>
              <p className="text-xs text-gray-600">
                Sign in to sync your Google Calendar and Tasks
              </p>
            </div>

            {error && (
              <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <Sidebar
            days={googleData}
            selectedDayIndex={selectedDayIndex}
            onDaySelect={handleDaySelect}
          />
        </div>
      </div>

      {/* Main Content - 80% width */}
      <div
        ref={mainContentRef}
        className="w-[80%] bg-canvas overflow-y-auto no-scrollbar"
      >
        {googleData.map((dayData, index) => (
          <div
            key={dayData.date.toISOString()}
            ref={(el) => {
              dayRefs.current[index] = el;
            }}
          >
            <Day dayData={dayData} />
          </div>
        ))}
        {isAuthenticated && (
          <div className="p-4 w-full text-center">
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

// App.tsx
import React, { useState, useRef, useEffect } from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { DUMMY_DATA } from "./data";
import { SCOPES } from "./logic/googleService";
import {
  useGoogleData,
  useRefreshGoogleData,
  useClearGoogleData,
  usePrefetchGoogleData,
} from "./hooks/useGoogleData";
import Day from "./components/Day";
import Sidebar from "./components/Sidebar";
import UndatedTasksSection from "./components/UndatedTasksSection";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "google_access_token",
  TOKEN_EXPIRY: "google_token_expiry",
  REFRESH_TOKEN: "google_refresh_token",
  IS_AUTHENTICATED: "google_is_authenticated",
};

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const App: React.FC = () => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string>("");

  const mainContentRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrollingFromClick = useRef(false);

  // Tanstack Query hooks
  const {
    data: googleData,
    isLoading,
    error: queryError,
    isError,
    isFetching,
    isRefetching,
  } = useGoogleData(accessToken, isAuthenticated);

  const { days, undatedTasks } = googleData ?? DUMMY_DATA;

  const refreshMutation = useRefreshGoogleData();
  const clearGoogleData = useClearGoogleData();
  const prefetchGoogleData = usePrefetchGoogleData();

  // Convert query error to string for display
  const error =
    isError && queryError
      ? queryError instanceof Error
        ? queryError.message
        : "An error occurred"
      : "";

  const isAuthError =
    isError &&
    queryError instanceof Error &&
    (queryError.message.includes("401") ||
      queryError.message.includes("403") ||
      queryError.message.includes("unauthorized"));

  // When the API returns 401/403, try refresh token first; only then logout
  useEffect(() => {
    if (!isAuthError) return;
    const storedRefresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (storedRefresh) {
      refreshAccessToken(storedRefresh)
        .then(({ access_token, expires_in }) => {
          setAccessToken(access_token);
          storeSession(access_token, expires_in);
          // Tanstack Query will refetch with new token
        })
        .catch(() => {
          console.log("🔑 Refresh failed, clearing session");
          logout();
        });
    } else {
      console.log("🔑 No refresh token, clearing session");
      logout();
    }
  }, [isAuthError]);

  // Check for existing session on component mount; refresh access token if expired but we have refresh_token
  useEffect(() => {
    const checkExistingSession = async () => {
      const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const storedExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      const storedRefresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const storedAuth = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED);

      console.log("🔍 Checking for existing session:", {
        hasToken: !!storedToken,
        hasExpiry: !!storedExpiry,
        hasRefreshToken: !!storedRefresh,
        isAuthenticated: storedAuth === "true",
      });

      if (storedAuth !== "true") {
        console.log("❌ No valid session found");
        return;
      }

      const expiryTime = parseInt(storedExpiry, 10);
      const now = Date.now();
      const isExpired = !storedExpiry || now >= expiryTime;

      if (storedToken && !isExpired) {
        console.log("✅ Valid session found, restoring authentication");
        setAccessToken(storedToken);
        setIsAuthenticated(true);
        prefetchGoogleData(storedToken);
        return;
      }

      if (storedRefresh) {
        try {
          const { access_token, expires_in } =
            await refreshAccessToken(storedRefresh);
          storeSession(access_token, expires_in);
          setAccessToken(access_token);
          setIsAuthenticated(true);
          prefetchGoogleData(access_token);
          console.log("✅ Session restored via refresh token");
          return;
        } catch (err) {
          console.warn("⏰ Refresh token failed, clearing session", err);
        }
      }

      clearStoredSession();
      console.log("❌ No valid session found");
    };

    checkExistingSession();
  }, [prefetchGoogleData]);

  // Helper function to store session data (optionally with refresh_token from initial login)
  const storeSession = (
    token: string,
    expiresIn: number = 3600,
    refreshToken?: string | null,
  ) => {
    const expiryTime = Date.now() + expiresIn * 1000;

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, "true");
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }

    console.log("💾 Session stored:", {
      expiresIn: `${expiresIn} seconds`,
      expiryTime: new Date(expiryTime).toLocaleString(),
      hasRefreshToken: !!refreshToken,
    });
  };

  // Helper function to clear stored session
  const clearStoredSession = () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    console.log("🗑️ Session cleared from storage");
  };

  // Call backend to exchange auth code for tokens (auth-code flow)
  const exchangeCodeForTokens = async (code: string) => {
    const redirect_uri = window.location.origin;
    const res = await fetch(`${API_BASE}/api/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Token exchange failed");
    return data as {
      access_token: string;
      expires_in: number;
      refresh_token: string | null;
    };
  };

  // Call backend to get new access token using refresh token
  const refreshAccessToken = async (refresh_token: string) => {
    const res = await fetch(`${API_BASE}/api/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Refresh failed");
    return data as { access_token: string; expires_in: number };
  };

  // Google Login (authorization code flow → backend exchanges for access + refresh token)
  const login = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      console.log("🔐 Google auth code received, exchanging for tokens...");
      try {
        const { access_token, expires_in, refresh_token } =
          await exchangeCodeForTokens(codeResponse.code);
        setAccessToken(access_token);
        setIsAuthenticated(true);
        storeSession(access_token, expires_in, refresh_token);
      } catch (err) {
        console.error("❌ Token exchange failed:", err);
        clearStoredSession();
      }
    },
    onError: (error) => {
      console.error("❌ Google login failed:", error);
      clearStoredSession();
    },
    scope: SCOPES,
  });

  // Manual refresh function using the mutation
  const handleRefresh = async () => {
    if (!accessToken) {
      console.warn("⚠️ No access token available for refresh");
      return;
    }

    try {
      await refreshMutation.mutateAsync(accessToken);
    } catch (err) {
      console.error("❌ Failed to refresh data:", err);

      // Check if it's an authentication error
      if (
        err instanceof Error &&
        (err.message.includes("401") || err.message.includes("unauthorized"))
      ) {
        console.log("🔑 Token appears to be invalid, clearing session");
        logout();
      }
    }
  };

  // Logout
  const logout = () => {
    console.log("🔐 Logging out...");
    googleLogout();
    setIsAuthenticated(false);
    setAccessToken("");
    clearStoredSession();
    clearGoogleData(); // Clear Tanstack Query cache
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
          <div className="p-4 border-b border-gray-200 shrink-0">
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

        {/* Loading indicator for authenticated users */}
        {isAuthenticated && (isLoading || isFetching || isRefetching) && (
          <div className="p-4 border-b border-gray-200 shrink-0">
            <div className="text-xs text-gray-600 text-center">
              {isRefetching ? "🔄 Updating..." : "📡 Loading..."}
            </div>
          </div>
        )}

        {/* Error display for authenticated users */}
        {isAuthenticated && error && (
          <div className="p-4 border-b border-gray-200 shrink-0">
            <div className="p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs">
              {error}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <Sidebar
            days={days}
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
        {undatedTasks.some((t) => !t.isCompleted) && (
          <UndatedTasksSection tasks={undatedTasks} accessToken={accessToken} />
        )}
        {days.map((dayData, index) => (
          <div
            key={dayData.date.toISOString()}
            ref={(el) => {
              dayRefs.current[index] = el;
            }}
          >
            <Day dayData={dayData} accessToken={accessToken} />
          </div>
        ))}
        {isAuthenticated && (
          <div className="p-4 w-full text-center">
            <div className="flex justify-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshMutation.isPending}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                {refreshMutation.isPending ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={logout}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

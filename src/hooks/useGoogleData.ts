// useGoogleData.ts - Tanstack Query hooks for Google data fetching
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchGoogleData } from "../logic/googleService";
import type { GoogleDataResponse } from "../types";

// Query keys for consistent cache management
export const googleQueryKeys = {
  all: ["google"] as const,
  data: (token: string) => [...googleQueryKeys.all, "data", token] as const,
  calendar: (token: string) =>
    [...googleQueryKeys.all, "calendar", token] as const,
  tasks: (token: string) => [...googleQueryKeys.all, "tasks", token] as const,
};

// Main hook for fetching Google data
export const useGoogleData = (
  accessToken: string,
  isAuthenticated: boolean,
) => {
  return useQuery<GoogleDataResponse>({
    queryKey: googleQueryKeys.data(accessToken),
    queryFn: () => fetchGoogleData(accessToken),
    enabled: isAuthenticated && !!accessToken, // Only run when authenticated
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when internet reconnects
    refetchInterval: 60 * 1000, // Auto-refresh every minute
    refetchIntervalInBackground: false, // Only refresh when tab is active
    retry: (failureCount, error) => {
      // Don't retry on auth errors (401/403)
      if (
        error instanceof Error &&
        (error.message.includes("401") || error.message.includes("403"))
      ) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

// Hook for manual refresh with loading state
export const useRefreshGoogleData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accessToken: string) => {
      // Invalidate and refetch the data
      await queryClient.invalidateQueries({
        queryKey: googleQueryKeys.data(accessToken),
      });
      return queryClient.fetchQuery({
        queryKey: googleQueryKeys.data(accessToken),
        queryFn: () => fetchGoogleData(accessToken),
      });
    },
    onSuccess: () => {
      console.log("✅ Google data refreshed successfully");
    },
    onError: (error) => {
      console.error("❌ Failed to refresh Google data:", error);
    },
  });
};

// Hook for clearing all Google data from cache (useful for logout)
export const useClearGoogleData = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({
      queryKey: googleQueryKeys.all,
    });
    console.log("🗑️ Google data cleared from cache");
  };
};

// Hook for prefetching data (useful for preloading on login)
export const usePrefetchGoogleData = () => {
  const queryClient = useQueryClient();

  return (accessToken: string) => {
    queryClient.prefetchQuery({
      queryKey: googleQueryKeys.data(accessToken),
      queryFn: () => fetchGoogleData(accessToken),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Hook for getting cached data without triggering a fetch
export const useGoogleDataCache = (accessToken: string) => {
  const queryClient = useQueryClient();

  return queryClient.getQueryData<GoogleDataResponse>(
    googleQueryKeys.data(accessToken),
  );
};
// Hook for completing a task
export const useCompleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accessToken,
      taskId,
    }: {
      accessToken: string;
      taskId: string;
    }) => {
      // Import the functions dynamically to avoid circular imports
      const { completeTask, findTaskListForTask } =
        await import("../logic/googleService");

      // First find which task list the task belongs to
      const taskListId = await findTaskListForTask(accessToken, taskId);
      if (!taskListId) {
        throw new Error("Could not find task list for task");
      }

      // Complete the task
      await completeTask(accessToken, taskListId, taskId);

      return { taskId, taskListId };
    },
    onSuccess: (data, variables) => {
      console.log("✅ Task completed successfully:", data);

      // Invalidate and refetch the Google data to get updated task list
      queryClient.invalidateQueries({
        queryKey: googleQueryKeys.data(variables.accessToken),
      });
    },
    onError: (error) => {
      console.error("❌ Failed to complete task:", error);

      // Optionally show a toast or error message here
      // For now, we'll just log it
    },
  });
};

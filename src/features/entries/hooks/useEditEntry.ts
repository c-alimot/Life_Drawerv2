import { useAuthStore } from "@store";
import { useCallback, useState } from "react";

export function useEditEntry(entryId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const updateEntry = useCallback(
    async (data: any) => {
      if (!user?.id) return false;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/entries/${entryId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        return response.ok;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user, entryId],
  );

  return { isLoading, error, updateEntry };
}

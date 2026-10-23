import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Fetches data from the backend API on mount and keeps it in state.
 * Used to replace static mockData.ts imports across the app with
 * live data from the MySQL-backed REST API.
 */
// NoInfer: the API client returns Promise<any>, so T must come from `fallback`
// or every consumer silently degrades to `any`.
export function useApiData<T>(fetcher: () => Promise<NoInfer<T>>, fallback: T, deps: unknown[] = []) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcherRef.current()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => load(), [load]);

  // refetch() re-runs the same fetcher and refreshes state — used after an action
  // (accepting a booking, updating a pre-order, etc.) so the UI reflects the new
  // backend state without a full page reload.
  const refetch = useCallback(async () => {
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to load data');
    }
  }, []);

  return { data, loading, error, setData, refetch };
}

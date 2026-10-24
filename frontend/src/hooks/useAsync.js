import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async function and tracks { data, loading, error }.
 * `immediate` (default true) runs the function on mount.
 */
export function useAsync(fn, deps = [], { immediate = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: immediate });
  const mounted = useRef(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await fnRef.current(...args);
        if (mounted.current) setState({ data, error: null, loading: false });
        return data;
      } catch (error) {
        if (mounted.current) setState({ data: null, error, loading: false });
        throw error;
      }
    },
    [],
  );

  useEffect(() => {
    if (!immediate) return undefined;
    run().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const setData = useCallback((data) => setState((p) => ({ ...p, data })), []);
  const reset = useCallback(
    () => setState({ data: null, error: null, loading: false }),
    [],
  );

  return { ...state, run, setData, reset };
}

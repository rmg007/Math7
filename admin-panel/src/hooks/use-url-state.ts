import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Syncs a piece of state (like a search filter) with URL query parameters.
 * Allows deep-linking and browser back/forward navigation for filter state.
 *
 * @example
 * const [search, setSearch] = useUrlState('q', '');
 * const [page, setPage] = useUrlState('page', '1');
 */
export function useUrlState(
  key: string,
  defaultValue: string
): [string, (value: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = useMemo(
    () => searchParams.get(key) ?? defaultValue,
    [searchParams, key, defaultValue]
  );

  const setValue = useCallback(
    (newValue: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (newValue === defaultValue || newValue === '') {
            next.delete(key);
          } else {
            next.set(key, newValue);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams, key, defaultValue]
  );

  return [value, setValue];
}

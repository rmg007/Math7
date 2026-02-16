import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Blocks navigation (both in-app and browser close/refresh) when there
 * are unsaved changes.  Works with `createBrowserRouter` only.
 *
 * @param isDirty - whether the form has unsaved edits
 * @param message - optional custom confirmation prompt (browser may ignore it)
 */
export function useUnsavedChangesGuard(
  isDirty: boolean,
  message = 'You have unsaved changes. Leave anyway?'
) {
  // Block in-app navigation via react-router
  const blocker = useBlocker(isDirty);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const leave = window.confirm(message);
      if (leave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, message]);

  // Block browser refresh / close
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}

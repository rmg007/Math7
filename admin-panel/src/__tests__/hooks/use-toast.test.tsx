import { toast, useToast } from '@/hooks/use-toast';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Clean up global toast state: dismiss all toasts and flush removal timers
    const { result, unmount } = renderHook(() => useToast());
    act(() => {
      result.current.dismiss(); // dismiss all
    });
    act(() => {
      vi.advanceTimersByTime(1000001); // flush TOAST_REMOVE_DELAY
    });
    unmount();
    vi.useRealTimers();
  });

  describe('toast function', () => {
    it('should create a toast with unique ID', () => {
      const toast1 = toast({ title: 'Test 1' });
      const toast2 = toast({ title: 'Test 2' });

      expect(toast1.id).toBeDefined();
      expect(toast2.id).toBeDefined();
      expect(toast1.id).not.toBe(toast2.id);
    });

    it('should return dismiss and update functions', () => {
      const result = toast({ title: 'Test' });

      expect(typeof result.dismiss).toBe('function');
      expect(typeof result.update).toBe('function');
      expect(result.id).toBeDefined();
    });

    it('should limit number of toasts to TOAST_LIMIT', () => {
      // Create multiple toasts
      const toasts = [];
      for (let i = 0; i < 5; i++) {
        toasts.push(toast({ title: `Toast ${i}` }));
      }

      const { result } = renderHook(() => useToast());

      // Should only have 3 toasts (TOAST_LIMIT = 3)
      expect(result.current.toasts).toHaveLength(3);
      expect(result.current.toasts[0].title).toBe('Toast 4'); // Last one (newest at index 0)
    });
  });

  describe('useToast hook', () => {
    it('should return initial empty state', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toEqual([]);
      expect(typeof result.current.toast).toBe('function');
      expect(typeof result.current.dismiss).toBe('function');
    });

    it('should add toast to state', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'New Toast' });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        title: 'New Toast',
        id: expect.any(String),
        open: true,
      });
    });

    it('should update existing toast', () => {
      const { result } = renderHook(() => useToast());

      let toastUpdate: (props: Record<string, unknown>) => void;
      act(() => {
        const toastResult = result.current.toast({ title: 'Original' });
        toastUpdate = toastResult.update;
      });

      act(() => {
        toastUpdate({
          title: 'Updated Title',
          description: 'New description',
        });
      });

      expect(result.current.toasts[0]).toMatchObject({
        title: 'Updated Title',
        description: 'New description',
      });
    });

    it('should dismiss specific toast', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const toastResult = result.current.toast({ title: 'Toast 1' });
        toastId = toastResult.id;
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.dismiss(toastId);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should dismiss all toasts when no ID provided', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Toast 1' });
        result.current.toast({ title: 'Toast 2' });
      });

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should remove toast after timeout', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const toastResult = result.current.toast({ title: 'Test Toast' });
        toastId = toastResult.id;
      });

      // Toast should be present
      expect(result.current.toasts).toHaveLength(1);

      // Dismiss the toast (triggers removal timer)
      act(() => {
        result.current.dismiss(toastId);
      });

      // Should still be there but not open
      expect(result.current.toasts[0].open).toBe(false);

      // Fast-forward time beyond TOAST_REMOVE_DELAY
      act(() => {
        vi.advanceTimersByTime(1000001); // TOAST_REMOVE_DELAY + 1
      });

      // Toast should be removed
      expect(result.current.toasts).toHaveLength(0);
    });

    it('should handle multiple listeners correctly', () => {
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());

      act(() => {
        result1.current.toast({ title: 'Shared Toast' });
      });

      // Both hooks should see the same toast
      expect(result1.current.toasts).toHaveLength(1);
      expect(result2.current.toasts).toHaveLength(1);
      expect(result1.current.toasts[0].id).toBe(result2.current.toasts[0].id);
    });

    it('should cleanup listener on unmount', () => {
      const { result, unmount } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Test' });
      });

      expect(result.current.toasts).toHaveLength(1);

      unmount();

      // Create another hook to check if toast is still there
      const { result: newResult } = renderHook(() => useToast());
      expect(newResult.current.toasts).toHaveLength(1);
    });

    it('should handle onOpenChange callback', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const toastResult = result.current.toast({ title: 'Test' });
        toastId = toastResult.id;
      });

      const toast = result.current.toasts.find((t) => t.id === toastId);
      expect(toast).toBeDefined();

      // Simulate onOpenChange being called with false
      expect(toast?.onOpenChange).toBeDefined();
      act(() => {
        toast?.onOpenChange?.(false);
      });

      // Toast should be dismissed
      expect(result.current.toasts[0].open).toBe(false);
    });
  });

  describe('reducer', () => {
    it('should handle ADD_TOAST action', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'New Toast', description: 'Description' });
      });

      expect(result.current.toasts[0]).toMatchObject({
        title: 'New Toast',
        description: 'Description',
        open: true,
      });
    });

    it('should handle UPDATE_TOAST action', () => {
      const { result } = renderHook(() => useToast());

      let toastUpdate: (props: Record<string, unknown>) => void;
      act(() => {
        const toastResult = result.current.toast({ title: 'Original' });
        toastUpdate = toastResult.update;
      });

      act(() => {
        toastUpdate({
          title: 'Updated Title',
          variant: 'destructive',
        });
      });

      expect(result.current.toasts[0]?.title).toBe('Updated Title');
      expect(result.current.toasts[0]?.variant).toBe('destructive');
    });

    it('should handle REMOVE_TOAST action with specific ID', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Toast 1' });
      });

      const toastId = result.current.toasts[0].id;

      act(() => {
        result.current.dismiss(toastId);
        vi.advanceTimersByTime(1000001); // Trigger removal
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should handle REMOVE_TOAST action without ID', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Toast 1' });
      });

      act(() => {
        result.current.dismiss();
        vi.advanceTimersByTime(1000001); // Trigger removal
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty toast object', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({});
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].id).toBeDefined();
      expect(result.current.toasts[0].open).toBe(true);
    });

    it('should handle toast with React nodes', () => {
      const { result } = renderHook(() => useToast());

      const titleText = 'React Title';
      const descriptionNode = <div>React Description</div>;

      act(() => {
        result.current.toast({ title: titleText, description: descriptionNode });
      });

      expect(result.current.toasts[0].title).toBe(titleText);
      expect(result.current.toasts[0].description).toBe(descriptionNode);
    });

    it('should handle rapid toast creation and dismissal', () => {
      const { result } = renderHook(() => useToast());

      // Rapidly create and dismiss toasts
      act(() => {
        for (let i = 0; i < 10; i++) {
          const toastResult = result.current.toast({ title: `Toast ${i}` });
          if (i % 2 === 0) {
            toastResult.dismiss();
          }
        }
      });

      // Should still only have 3 toasts due to limit
      expect(result.current.toasts).toHaveLength(3);
    });

    it('should handle dismiss before timeout', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const toastResult = result.current.toast({ title: 'Test' });
        toastId = toastResult.id;
      });

      // Dismiss immediately
      act(() => {
        result.current.dismiss(toastId);
      });

      // Toast is dismissed (open=false) but not yet removed from array
      expect(result.current.toasts[0].open).toBe(false);

      // Advance time past TOAST_REMOVE_DELAY to flush removal queue
      act(() => {
        vi.advanceTimersByTime(1000001);
      });

      // Now the toast should be fully removed
      expect(result.current.toasts).toHaveLength(0);
    });
  });
});

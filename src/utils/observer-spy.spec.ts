import { describe, it, expect } from 'vitest';
import { of, throwError, timer, take, map, Observable, switchMap } from 'rxjs';
import { observe } from './observer-spy';

describe('observe function', () => {
  describe('synchronous observable', () => {
    it('collects values and completes', async () => {
      const source$ = of(1, 2, 3);
      const result = observe(source$);

      await result.waitForComplete();

      expect(result.getValues()).toEqual([1, 2, 3]);
      expect(result.getFirstValue()).toBe(1);
      expect(result.getLastValue()).toBe(3);
      expect(result.getValueAt(1)).toBe(2);
      expect(result.isComplete()).toBe(true);
      expect(result.isError()).toBe(false);
      expect(result.getError()).toBeUndefined();
    });

    it('handles errors', async () => {
      const testError = new Error('Error');
      const source$ = throwError(() => testError);
      const result = observe(source$);

      await result.waitForError();

      expect(result.getValues()).toEqual([]);
      expect(result.isComplete()).toBe(false);
      expect(result.isError()).toBe(true);
      expect(result.getError()).toBe(testError);
    });
  });

  describe('asynchronous observable', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('collects async values and completes', async () => {
      const source$ = timer(100, 100).pipe(
        map((n) => n + 1),
        take(3)
      );
      const result = observe(source$);

      vi.advanceTimersByTime(300);

      await result.waitForComplete();

      expect(result.getValues()).toEqual([1, 2, 3]);
      expect(result.isComplete()).toBe(true);
    });

    it('handles async errors', async () => {
      const testError = new Error('Error');
      const source$ = timer(100).pipe(
        map(() => {
          throw testError;
        })
      );
      const result = observe(source$);

      vi.advanceTimersByTime(100);

      await result.waitForError();

      expect(result.getValues()).toEqual([]);
      expect(result.isError()).toBe(true);
      expect(result.getError()).toBe(testError);
    });
  });

  describe('utility methods', () => {
    it('returns undefined for invalid indices', () => {
      const source$ = of(10, 20);
      const result = observe(source$);

      expect(result.getValueAt(5)).toBeUndefined();
      expect(result.getFirstValue()).toBe(10);
      expect(result.getLastValue()).toBe(20);
    });

    it('handles empty observables', async () => {
      const source$ = of();
      const result = observe(source$);

      await result.waitForComplete();

      expect(result.getValues()).toEqual([]);
      expect(result.getFirstValue()).toBeUndefined();
      expect(result.getLastValue()).toBeUndefined();
    });
  });

  describe('subscription management', () => {
    it('unsubscribes when requested', () => {
      const completeSpy = vi.fn();
      const source$ = new Observable((subscriber) => {
        subscriber.next(1);
        return completeSpy;
      });

      const result = observe(source$);
      result.subscription.unsubscribe();

      expect(completeSpy).toHaveBeenCalled();
    });
  });
});

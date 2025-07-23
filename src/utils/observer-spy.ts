import { Observable, Subscription } from 'rxjs';
import { vi } from 'vitest';

type ResolveCallback = (() => void) | undefined;
type ObserverSpy<T> = {
  subscription: Subscription;
  isComplete: () => boolean;
  isError: () => boolean;
  getValues: () => T[];
  getFirstValue: () => T;
  getLastValue: () => T;
  getValueAt: (index: number) => T;
  getError: () => unknown;
  waitForComplete: () => Promise<void>;
  waitForError: () => Promise<void>;
};

export function observe<T>(observable: Observable<T>): ObserverSpy<T> {
  let resolveComplete: ResolveCallback;
  let resolveError: ResolveCallback;

  const completePromise = new Promise<void>((resolve) => {
    resolveComplete = resolve;
  });
  const errorPromise = new Promise<void>((resolve) => {
    resolveError = resolve;
  });
  const values: T[] = [];

  let error = undefined;

  const observer = {
    next: vi.fn((value: T) => {
      values.push(value);
    }),
    error: vi.fn((value: unknown) => {
      error = value;
      resolveError?.();
    }),
    complete: vi.fn(() => {
      resolveComplete?.();
    }),
  };

  const subscription = observable.subscribe(observer);

  return {
    subscription,
    isComplete: () => observer.complete.mock.calls.length > 0,
    isError: () => observer.error.mock.calls.length > 0,
    getValues: () => [...values],
    getFirstValue: () => values[0],
    getLastValue: () => values[values.length - 1],
    getValueAt: (index: number) => values[index],
    getError: () => error,
    waitForComplete: () => completePromise,
    waitForError: () => errorPromise,
  };
}

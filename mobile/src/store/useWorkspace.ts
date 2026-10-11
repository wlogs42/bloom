import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { type Workspace } from '@/shared/api/types';
import { getWorkspace, updateTimer } from '@/shared/api/workspace';

export function useWorkspace() {
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [offset, setOffset] = useState(0);
  const pending = useRef(false);
  const mounted = useRef(true);
  const revision = useRef(0);
  const completionRequested = useRef<string | null>(null);

  const apply = useCallback((next: Workspace) => {
    setOffset(Date.now() - next.serverNow);
    setData(next);
    setNow(Date.now());
  }, []);

  const refresh = useCallback(async () => {
    if (pending.current) return;
    const version = revision.current;
    try {
      const result = await getWorkspace();
      if (mounted.current && version === revision.current) {
        apply(result);
        setError('');
      }
    } catch (reason) {
      if (mounted.current)
        setError(reason instanceof Error ? reason.message : 'Не вдалося завантажити дані.');
    }
  }, [apply]);

  const mutate = useCallback(
    async (operation: () => Promise<Workspace>) => {
      if (pending.current) return false;
      pending.current = true;
      revision.current++;
      setBusy(true);
      setError('');
      try {
        const result = await operation();
        if (mounted.current) apply(result);
        return true;
      } catch (reason) {
        if (mounted.current)
          setError(reason instanceof Error ? reason.message : 'Не вдалося зберегти дані.');
        return false;
      } finally {
        pending.current = false;
        if (mounted.current) setBusy(false);
      }
    },
    [apply]
  );

  useEffect(() => {
    mounted.current = true;
    void Promise.resolve().then(refresh);
    const poll = setInterval(() => void refresh(), 15_000);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void Promise.resolve().then(refresh);
    });
    return () => {
      mounted.current = false;
      clearInterval(poll);
      appState.remove();
    };
  }, [refresh]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(tick);
  }, []);

  const remainingSeconds = data
    ? Math.max(
        0,
        Math.ceil(
          (data.timer.deadline === null
            ? data.timer.remainingMs
            : data.timer.deadline - (now - offset)) / 1000
        )
      )
    : 25 * 60;

  useEffect(() => {
    if (
      data?.timer.deadline &&
      remainingSeconds === 0 &&
      completionRequested.current !== data.timer.runId
    ) {
      completionRequested.current = data.timer.runId;
      void Promise.resolve().then(refresh);
    }
  }, [data, remainingSeconds, refresh]);

  return {
    data,
    error,
    busy,
    refresh,
    mutate,
    now,
    timer: {
      remainingSeconds,
      durationMinutes: data?.timer.durationMinutes ?? 25,
      isRunning: data?.timer.deadline != null && remainingSeconds > 0,
      disabled: busy || !data,
      hasStarted:
        !!data &&
        (data.timer.deadline !== null ||
          data.timer.remainingMs < data.timer.durationMinutes * 60_000),
      startPause: () =>
        void mutate(() =>
          updateTimer(data?.timer.deadline && remainingSeconds > 0 ? 'pause' : 'start')
        ),
      reset: () => void mutate(() => updateTimer('reset')),
      setDuration: (minutes: number) => void mutate(() => updateTimer('duration', minutes)),
    },
  };
}

import { Participation } from '../types/studyGroup';

export const trackOptimisticParticipation = (
  current: Participation | null,
  newParticipation: Participation
): Participation => {
  return newParticipation;
};

export const measureLatency = async <T>(
  action: () => Promise<T>,
  onMetrics?: (ms: number) => void
): Promise<T> => {
  const start = performance.now();
  try {
    return await action();
  } finally {
    const elapsed = performance.now() - start;
    if (onMetrics) onMetrics(elapsed);
  }
};

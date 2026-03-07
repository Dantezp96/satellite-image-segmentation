import { useState, useCallback } from "react";
import type { SegmentationResult } from "../utils/postprocess";

export interface SegStats {
  inferenceTime: number;
  totalPixels: number;
  classPercentages: number[];
  dominantClass: number;
  resolution: string;
  totalSegmentations: number;
}

const INITIAL: SegStats = {
  inferenceTime: 0,
  totalPixels: 0,
  classPercentages: [],
  dominantClass: -1,
  resolution: "—",
  totalSegmentations: 0,
};

export function useStats() {
  const [stats, setStats] = useState<SegStats>(INITIAL);

  const update = useCallback(
    (result: SegmentationResult, timeMs: number, width: number, height: number) => {
      setStats((prev) => ({
        inferenceTime: Math.round(timeMs),
        totalPixels: width * height,
        classPercentages: result.classPercentages,
        dominantClass: result.dominantClass,
        resolution: `${width}×${height}`,
        totalSegmentations: prev.totalSegmentations + 1,
      }));
    },
    [],
  );

  const reset = useCallback(() => setStats(INITIAL), []);

  return { stats, update, reset };
}

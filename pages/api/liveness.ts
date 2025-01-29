import { NextApiRequest, NextApiResponse } from 'next';
import { formatMinutesToHours } from '../../utils/time';

interface ProcessedData {
  blockTime: Date;
  timeDiff?: number;
  rollingAvg?: number;
  rollingStd?: number;
  zScore?: number;
  zScoreBoundary?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name = 'arbitrum', metricType = 'stateUpdates' } = req.query;

  try {
    const apiRes = await fetch(
      `https://l2beat.com/api/liveness-txs/${name}?subtype=${metricType}`
    );
    const responseData = await apiRes.json();

    const timestamps = responseData.data?.timestamps || [];

    // Sort timestamps in ascending order (oldest first)
    timestamps.sort((a: number, b: number) => a - b);

    // Create initial processed data with time differences
    const processed: ProcessedData[] = timestamps.map((timestamp: number, index: number, arr: number[]) => {
      const currentDate = new Date(timestamp * 1000);
      const prevDate = index > 0 ? new Date(arr[index - 1] * 1000) : null;

      return {
        blockTime: currentDate,
        timeDiff: prevDate ?
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60) : // Convert to minutes
          undefined
      };
    });

    // Calculate rolling statistics
    let windowStart = 0;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    processed.forEach((entry, index) => {
      if (index === 0 || typeof entry.timeDiff === 'undefined') return;

      const currentTime = entry.blockTime.getTime();
      const sevenDaysAgo = currentTime - sevenDaysMs;

      // Adjust window start to maintain 7-day window
      while (windowStart < index &&
        processed[windowStart].blockTime.getTime() < sevenDaysAgo) {
        windowStart++;
      }

      // Get valid data points in the window
      const windowData = processed
        .slice(windowStart, index)
        .filter(d => typeof d.timeDiff !== 'undefined') as Array<Required<ProcessedData>>;

      // Skip calculation if no data points
      if (windowData.length === 0) return;

      // Calculate rolling average
      const sum = windowData.reduce((acc, d) => acc + d.timeDiff, 0);
      const mean = sum / windowData.length;
      entry.rollingAvg = mean;

      // Calculate rolling standard deviation (sample variance)
      if (windowData.length > 1) {
        const squaredDiffs = windowData.map(d => Math.pow(d.timeDiff - mean, 2));
        const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / (windowData.length - 1);
        entry.rollingStd = Math.sqrt(variance);
      } else {
        entry.rollingStd = 0;
      }

      // Calculate z-score and boundary
      if (entry.rollingStd && entry.rollingStd > 0) {
        entry.zScore = (entry.timeDiff - mean) / entry.rollingStd;
        entry.zScoreBoundary = mean + 9 * entry.rollingStd;
      }
    });

    res.status(200).json(processed);
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({ error: 'Failed to process data' });
  }
}

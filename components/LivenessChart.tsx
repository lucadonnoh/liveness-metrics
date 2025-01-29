"use client";
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface LivenessData {
  blockTime: number;
  timeDiff?: number;
  rollingAvg?: number;
  zScoreBoundary?: number;
}

interface LivenessChartProps {
  projectName: string;
  metricType: string;
}

const LivenessChart = ({ projectName, metricType }: LivenessChartProps) => {
  const [data, setData] = useState<LivenessData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/liveness?name=${projectName}&metricType=${metricType}`
        );

        if (!response.ok) throw new Error(`HTTP error! ${response.status}`);

        const jsonData = await response.json();

        if (!Array.isArray(jsonData)) {
          throw new Error('Invalid data format from API');
        }

        const processedData = jsonData.map((d: LivenessData) => ({
          ...d,
          blockTime: new Date(d.blockTime).getTime(),
          rollingAvg: d.rollingAvg ?? undefined,
          zScoreBoundary: d.zScoreBoundary ?? undefined
        })).filter((d: LivenessData) => d.timeDiff !== undefined);

        setData(processedData);
        setIsLoading(false);
      } catch (error) {
        console.error('Fetch error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectName, metricType]);

  if (isLoading) return (
    <div className="bg-white p-4 rounded-lg shadow animate-pulse">
      <div className="h-8 bg-gray-200 rounded mb-4 w-1/2"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 p-4 rounded-lg shadow">
      <h2 className="text-red-600 font-semibold mb-2">{projectName}</h2>
      <p className="text-red-500">Error: {error}</p>
    </div>
  );

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4 capitalize">{projectName}</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="blockTime"
              type="number"
              tickFormatter={(time) => format(new Date(time), 'dd/MM')}
              scale="time"
              minTickGap={30}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis
              domain={['auto', 'auto']}
              width={80}
              tickFormatter={(value) => `${Math.round(value)}m`}
            />
            <Tooltip
              labelFormatter={(label) => format(new Date(label), 'PPpp')}
              formatter={(value) => [
                Number(value).toFixed(2) + ' minutes',
                'Value'
              ]}
            />
            <Line
              type="monotone"
              dataKey="timeDiff"
              name="Interval"
              stroke="#8884d8"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="rollingAvg"
              name="7-Day Average"
              stroke="#82ca9d"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="zScoreBoundary"
              name="Anomaly Threshold"
              stroke="#ff7300"
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LivenessChart;

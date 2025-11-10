import { useEffect, useRef } from 'react';
import { createChart, type CandlestickData } from 'lightweight-charts';

interface CandlestickChartProps {
  data: CandlestickData[];
  color?: string;
}

const CandlestickChart = ({ data, color = '#00F28F' }: CandlestickChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addCandlestickSeries']> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();

    const chart = createChart(container, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#E2E8F0'
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.1)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.1)' }
      },
      crosshair: {
        mode: 0
      },
      rightPriceScale: {
        borderVisible: false
      },
      timeScale: {
        borderVisible: false
      }
    });

    const series = chart.addCandlestickSeries({
      upColor: color,
      borderUpColor: color,
      wickUpColor: color,
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      wickDownColor: '#ef4444'
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });

    if (width > 0 && height > 0) {
      chart.applyOptions({ width, height });
    }

    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [color]);

  useEffect(() => {
    if (seriesRef.current && chartRef.current) {
      seriesRef.current.setData(data);
      chartRef.current.timeScale().fitContent();
    }
  }, [data]);

  return <div ref={containerRef} className="h-full w-full" aria-label="Candlestick chart" role="img" />;
};

export default CandlestickChart;

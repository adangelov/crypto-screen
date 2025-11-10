import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CandlestickData } from 'lightweight-charts';
import CandlestickChart from './CandlestickChart';
import Skeleton from './Skeleton';

type PeriodValue = '4h' | '24h' | '3d' | '1m' | '3m' | '1y' | '2y' | 'max';

type PeriodOption = {
  label: string;
  value: PeriodValue;
  daysParam: 1 | 7 | 14 | 30 | 90 | 180 | 365 | 'max';
  trimToHours?: number;
  trimToDays?: number;
};

const periods: readonly PeriodOption[] = [
  { label: '4H', value: '4h', daysParam: 1, trimToHours: 4 },
  { label: '24H', value: '24h', daysParam: 1, trimToHours: 24 },
  { label: '3D', value: '3d', daysParam: 7, trimToDays: 3 },
  { label: '1M', value: '1m', daysParam: 30 },
  { label: '3M', value: '3m', daysParam: 90 },
  { label: '1Y', value: '1y', daysParam: 365 },
  { label: '2Y', value: '2y', daysParam: 'max', trimToDays: 365 * 2 },
  { label: 'MAX', value: 'max', daysParam: 'max' }
] as const;

export interface CoinSummary {
  id: string;
  name: string;
  symbol: string;
  image: string;
}

interface CoinCardProps {
  coin: CoinSummary;
  onRemove: (id: string) => void;
}

const baseUrl = 'https://api.coingecko.com/api/v3';

const CoinCard = ({ coin, onRemove }: CoinCardProps) => {
  const [period, setPeriod] = useState<PeriodOption['value']>(periods[3].value);
  const [data, setData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOhlc = useCallback(
    async (periodOption: PeriodOption) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `${baseUrl}/coins/${coin.id}/ohlc?vs_currency=usd&days=${periodOption.daysParam}`
        );
        if (!response.ok) {
          throw new Error('Unable to fetch OHLC data');
        }
        const raw = (await response.json()) as [number, number, number, number, number][];
        let formatted: CandlestickData[] = raw.map(([timestamp, open, high, low, close]) => ({
          time: (timestamp / 1000) as CandlestickData['time'],
          open,
          high,
          low,
          close
        }));
        const latest = formatted.length > 0 ? formatted[formatted.length - 1].time : null;
        if (typeof latest === 'number') {
          if (periodOption.trimToHours) {
            const cutoff = latest - periodOption.trimToHours * 60 * 60;
            formatted = formatted.filter(({ time }) => (typeof time === 'number' ? time >= cutoff : true));
          }

          if (periodOption.trimToDays) {
            const cutoff = latest - periodOption.trimToDays * 24 * 60 * 60;
            formatted = formatted.filter(({ time }) => (typeof time === 'number' ? time >= cutoff : true));
          }
        }
        setData(formatted);
      } catch (err) {
        setError((err as Error).message);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    },
    [coin.id]
  );

  useEffect(() => {
    const selectedPeriod = periods.find(({ value }) => value === period) ?? periods[0];
    fetchOhlc(selectedPeriod);
  }, [fetchOhlc, period]);

  const periodButtons = useMemo(
    () =>
      periods.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          onClick={() => setPeriod(value)}
          className={`rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
            period === value ? 'bg-accent-500 text-slate-900' : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
          }`}
          aria-pressed={period === value}
        >
          {label}
        </button>
      )),
    [period]
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-surface/80 shadow-card">
      <header className="grid-drag-handle flex cursor-move items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={coin.image} alt="" className="h-10 w-10 rounded-full border border-slate-800" loading="lazy" />
          <div>
            <h2 className="text-base font-semibold text-slate-100">{coin.name}</h2>
            <p className="text-xs uppercase tracking-widest text-accent-400">{coin.symbol}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(coin.id)}
          className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-400 transition hover:border-red-400 hover:text-red-400"
          aria-label={`Remove ${coin.name} card`}
        >
          Remove
        </button>
      </header>
      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Select time period">
          {periodButtons}
        </div>
        <div className="relative flex-1">
          {isLoading && <Skeleton className="absolute inset-0 h-full w-full" />}
          {error && !isLoading && (
            <div className="flex h-64 items-center justify-center rounded-lg border border-red-500/40 bg-red-500/10 text-sm text-red-300">
              {error}
            </div>
          )}
          {!error && data.length === 0 && !isLoading && (
            <div className="flex h-64 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-sm text-slate-400">
              No OHLC data available.
            </div>
          )}
          {data.length > 0 && (
            <div className="h-72">
              <CandlestickChart data={data} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoinCard;

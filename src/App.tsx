import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Layout, Layouts } from 'react-grid-layout';
import LayoutGrid from './components/LayoutGrid';
import SearchBar, { type CoinSearchResult } from './components/SearchBar';
import CoinCard, { type CoinSummary } from './components/CoinCard';
import Skeleton from './components/Skeleton';

const LAYOUT_KEY = 'crypto-screen-layouts';
const COINS_KEY = 'crypto-screen-coins';
const baseUrl = 'https://api.coingecko.com/api/v3';

const columnSpan = { lg: 4, md: 5, sm: 4, xs: 4, xxs: 2 } as const;

const DEFAULT_COINS: CoinSummary[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png?1547033579'
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880'
  }
];

const createEmptyLayouts = (): Layouts => ({ lg: [], md: [], sm: [], xs: [], xxs: [] });

const App = () => {
  const [coins, setCoins] = useState<CoinSummary[]>([]);
  const [layouts, setLayouts] = useState<Layouts>(() => createEmptyLayouts());
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const generateNewLayouts = useCallback(
    (coinId: string, currentLayouts: Layouts, itemCount: number): Layouts => {
      const nextLayouts: Layouts = { ...currentLayouts };
      (Object.keys(columnSpan) as Array<keyof typeof columnSpan>).forEach((breakpoint) => {
        const span = columnSpan[breakpoint];
        const cols =
          breakpoint === 'lg'
            ? 12
            : breakpoint === 'md'
              ? 10
              : breakpoint === 'sm'
                ? 8
                : breakpoint === 'xs'
                  ? 4
                  : 2;
        const layout: Layout[] = nextLayouts[breakpoint] ? [...nextLayouts[breakpoint]!] : [];
        layout.push({
          i: coinId,
          x: (itemCount * span) % cols,
          y: Infinity,
          w: span,
          h: 18,
          minH: 12,
          minW: Math.min(span, cols)
        });
        nextLayouts[breakpoint] = layout;
      });
      return nextLayouts;
    },
    []
  );

  useEffect(() => {
    try {
      const storedCoins = localStorage.getItem(COINS_KEY);
      const storedLayouts = localStorage.getItem(LAYOUT_KEY);

      let parsedCoins: CoinSummary[] | null = null;
      if (storedCoins) {
        const restoredCoins = JSON.parse(storedCoins) as CoinSummary[];
        parsedCoins = restoredCoins;
        setCoins(restoredCoins);
      } else {
        setCoins(DEFAULT_COINS);
      }

      if (storedLayouts) {
        setLayouts(JSON.parse(storedLayouts));
      } else {
        const coinsToLayout = parsedCoins ?? DEFAULT_COINS;
        const seededLayouts = coinsToLayout.reduce<Layouts>((acc, coin, index) => {
          return generateNewLayouts(coin.id, acc, index);
        }, createEmptyLayouts());
        setLayouts(seededLayouts);
      }
    } catch (error) {
      console.error('Failed to restore dashboard state', error);
    } finally {
      setIsBootstrapping(false);
    }
  }, [generateNewLayouts]);

  useEffect(() => {
    if (!isBootstrapping) {
      localStorage.setItem(COINS_KEY, JSON.stringify(coins));
    }
  }, [coins, isBootstrapping]);

  useEffect(() => {
    if (!isBootstrapping) {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(layouts));
    }
  }, [layouts, isBootstrapping]);

  const handleSelectCoin = useCallback(
    async (result: CoinSearchResult) => {
      try {
        setFeedback(null);
        if (coins.some((coin) => coin.id === result.id)) {
          setFeedback('That coin is already on your dashboard.');
          return;
        }
        const response = await fetch(`${baseUrl}/coins/${result.id}`);
        if (!response.ok) {
          throw new Error('Unable to fetch coin details');
        }
        const payload = await response.json();
        const summary: CoinSummary = {
          id: payload.id,
          name: payload.name,
          symbol: payload.symbol?.toUpperCase() ?? result.symbol.toUpperCase(),
          image: payload.image?.small ?? result.thumb
        };
        setCoins((prev) => [...prev, summary]);
        setLayouts((prev) => generateNewLayouts(summary.id, prev, prev.lg?.length ?? 0));
      } catch (error) {
        setFeedback((error as Error).message);
      }
    },
    [coins, generateNewLayouts]
  );

  const handleRemove = useCallback((id: string) => {
    setCoins((prev) => prev.filter((coin) => coin.id !== id));
    setLayouts((prevLayouts) => {
      const nextLayouts: Layouts = {} as Layouts;
      Object.entries(prevLayouts).forEach(([breakpoint, layout]) => {
        nextLayouts[breakpoint as keyof Layouts] = layout?.filter((item) => item.i !== id) ?? [];
      });
      return nextLayouts;
    });
  }, []);

  const handleLayoutChange = useCallback((_: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
  }, []);

  const dashboardContent = useMemo(() => {
    if (coins.length === 0) {
      return (
        <div className="mt-24 rounded-3xl border border-dashed border-slate-800 bg-surface/60 p-12 text-center text-slate-400">
          <h2 className="text-xl font-semibold text-slate-200">No coins yet</h2>
          <p className="mt-2 text-sm text-slate-400">
            Use the search above to add your first cryptocurrency and start tracking its market structure.
          </p>
        </div>
      );
    }

    return (
      <LayoutGrid layouts={layouts} onLayoutChange={handleLayoutChange}>
        {coins.map((coin) => (
          <div key={coin.id} data-grid={{ i: coin.id }}>
            <CoinCard coin={coin} onRemove={handleRemove} />
          </div>
        ))}
      </LayoutGrid>
    );
  }, [coins, handleLayoutChange, handleRemove, layouts]);

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-6 pb-12 pt-10">
      <header className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Crypto Screen</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Track the market structure of your favorite coins with responsive, accessible charts powered by CoinGecko data.
          </p>
        </div>
        <SearchBar onSelect={handleSelectCoin} />
        {feedback && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{feedback}</div>}
      </header>

      {isBootstrapping ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <main className="flex-1 pb-16">{dashboardContent}</main>
      )}

      <footer className="mt-auto text-center text-xs text-slate-500">
        Version: 0.1.3
      </footer>
    </div>
  );
};

export default App;

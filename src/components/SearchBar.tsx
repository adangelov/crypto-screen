import { useEffect, useMemo, useState } from 'react';

interface CoinSearchResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
}

interface SearchBarProps {
  onSelect: (coin: CoinSearchResult) => void;
}

const endpoint = 'https://api.coingecko.com/api/v3/search';

const SearchBar = ({ onSelect }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CoinSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${endpoint}?query=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error('Failed to search coins');
        }

        const data = await response.json();
        const mappedResults: CoinSearchResult[] = (data?.coins ?? []).map((coin: any) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          thumb: coin.thumb
        }));
        setResults(mappedResults);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message);
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const shouldShowResults = useMemo(() => query.length > 1 && (results.length > 0 || !!error), [
    query,
    results,
    error
  ]);

  return (
    <div className="relative">
      <label htmlFor="coin-search" className="sr-only">
        Search for a cryptocurrency
      </label>
      <input
        id="coin-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by coin name or ticker"
        className="w-full rounded-lg border border-slate-800 bg-surface/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/60"
        aria-autocomplete="list"
        aria-controls="search-results"
        aria-expanded={shouldShowResults}
      />

      {shouldShowResults && (
        <div
          id="search-results"
          role="listbox"
          className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-800 bg-surface/95 p-2 shadow-xl backdrop-blur"
        >
          {isLoading && <div className="px-3 py-2 text-sm text-slate-400">Searching...</div>}
          {error && <div className="px-3 py-2 text-sm text-red-400">{error}</div>}
          {!isLoading && !error &&
            results.map((coin) => (
              <button
                key={coin.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800/70 focus:bg-slate-800/70"
                onClick={() => {
                  onSelect(coin);
                  setQuery('');
                  setResults([]);
                }}
                role="option"
              >
                <img src={coin.thumb} alt="" className="h-6 w-6 rounded-full" loading="lazy" />
                <div className="flex flex-col">
                  <span className="font-medium">{coin.name}</span>
                  <span className="text-xs uppercase text-slate-400">{coin.symbol}</span>
                </div>
              </button>
            ))}
          {!isLoading && !error && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-400">No matches found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export type { CoinSearchResult };
export default SearchBar;

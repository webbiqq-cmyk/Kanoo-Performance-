import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSearchIndex } from "../../state/store";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const search = useSearchIndex();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const results = search(query);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(href: string) {
    navigate(href);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-sm">
      <label htmlFor="global-search" className="sr-only">
        Search jobs, quotes, invoices and customers
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-line bg-elevated px-3 py-2 focus-within:border-cyan/60">
        <Search size={15} className="text-ink-faint" />
        <input
          id="global-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search jobs, quotes, invoices, customers…"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
        />
        <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[10px] text-ink-faint sm:block">/</kbd>
      </div>
      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-lg border border-line-strong bg-elevated shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)]">
          {results.length === 0 ? (
            <div className="px-4 py-4 text-sm text-ink-faint">No matches for “{query}”.</div>
          ) : (
            results.map((r) => (
              <button
                key={r.href + r.label}
                onClick={() => go(r.href)}
                className="flex w-full flex-col items-start gap-0.5 border-b border-line px-4 py-2.5 text-left last:border-0 hover:bg-surface-2"
              >
                <span className="text-sm font-medium text-ink">{r.label}</span>
                <span className="text-xs text-ink-faint">{r.sub}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

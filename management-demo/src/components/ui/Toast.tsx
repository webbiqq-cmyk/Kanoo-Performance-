import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
  tone: "ok" | "info" | "warn";
}

interface ToastContextValue {
  show: (message: string, tone?: ToastItem["tone"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, tone: ToastItem["tone"] = "ok") => {
    const id = ++idRef.current;
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 no-print"
        role="status"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-line-strong bg-elevated px-4 py-2.5 text-sm text-ink shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)]"
            style={{ animation: "toastIn .2s ease" }}
          >
            {t.tone === "ok" && <CheckCircle2 size={16} className="text-ok" />}
            {t.tone === "info" && <Info size={16} className="text-cyan" />}
            {t.tone === "warn" && <AlertTriangle size={16} className="text-warn" />}
            <span>{t.message}</span>
            <button
              aria-label="Dismiss"
              onClick={() => setItems((prev) => prev.filter((i) => i.id !== t.id))}
              className="ml-1 text-ink-faint hover:text-ink"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

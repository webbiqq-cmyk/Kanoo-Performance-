import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "../../lib/useFocusTrap";

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "drawer" | "dialog";
  width?: string;
}

export function Overlay({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant = "drawer",
  width = "min(560px, 100vw)",
}: OverlayProps) {
  const ref = useFocusTrap(open, onClose);
  if (!open) return null;

  const isDrawer = variant === "drawer";

  return (
    <div className="fixed inset-0 z-50 no-print" role="presentation">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-[fadeIn_.15s_ease]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="overlay-title"
        tabIndex={-1}
        className={
          isDrawer
            ? "absolute right-0 top-0 h-full bg-surface border-l border-line flex flex-col outline-none animate-[slideIn_.22s_cubic-bezier(0.16,1,0.3,1)]"
            : "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[88vh] w-[min(520px,92vw)] rounded-2xl bg-surface border border-line flex flex-col outline-none animate-[popIn_.16s_ease]"
        }
        style={isDrawer ? { width } : undefined}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 id="overlay-title" className="font-display text-xl font-semibold tracking-wide text-ink">
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-ink-dim">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-line p-2 text-ink-dim transition hover:border-line-strong hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

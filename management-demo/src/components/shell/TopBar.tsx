import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { SearchBox } from "./SearchBox";
import { NotificationBell, NotificationDrawer } from "./NotificationDrawer";
import { Button } from "../ui/Button";
import { Overlay } from "../ui/Overlay";
import { useActions } from "../../state/store";
import { useToast } from "../ui/Toast";

export function TopBar({ title, context }: { title: string; context?: string }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const actions = useActions();
  const toast = useToast();

  return (
    <header className="flex h-16 flex-none items-center justify-between gap-6 border-b border-line bg-surface/80 px-6 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate font-display text-lg font-semibold tracking-wide text-ink">{title}</h1>
        {context && <p className="truncate text-xs text-ink-faint">{context}</p>}
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">
        <SearchBox />
        <NotificationBell onClick={() => setNotifOpen(true)} />
        <button
          onClick={() => setResetOpen(true)}
          aria-label="Reset demo data"
          className="rounded-lg border border-line p-2.5 text-ink-dim transition hover:border-line-strong hover:text-ink"
          title="Reset demo data"
        >
          <RotateCcw size={17} />
        </button>
      </div>

      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <Overlay
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        variant="dialog"
        title="Reset demo data?"
        subtitle="This restores the original seeded jobs, quotes and invoices and discards everything created in this session."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                actions.reset();
                setResetOpen(false);
                toast.show("Demo data reset to initial state", "info");
              }}
            >
              Reset data
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-dim">This action only affects data stored in this browser for the demo. Nothing else is deleted.</p>
      </Overlay>
    </header>
  );
}

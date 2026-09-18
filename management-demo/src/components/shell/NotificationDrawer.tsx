import { Bell, CheckCheck } from "lucide-react";
import { Overlay } from "../ui/Overlay";
import { Button } from "../ui/Button";
import { useAppState, useActions } from "../../state/store";

function timeAgo(at: number): string {
  const diff = Date.now() - at;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function NotificationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useAppState();
  const actions = useActions();

  return (
    <Overlay
      open={open}
      onClose={onClose}
      title="Activity"
      subtitle={`${state.activity.filter((a) => !a.read).length} unread`}
      footer={
        <Button variant="ghost" size="sm" className="w-full" onClick={actions.markAllActivityRead}>
          <CheckCheck size={14} /> Mark all as read
        </Button>
      }
    >
      <ul className="space-y-2">
        {state.activity.map((a) => (
          <li
            key={a.id}
            className={`rounded-lg border px-4 py-3 text-sm ${
              a.read ? "border-line bg-surface-2" : "border-line-strong bg-elevated"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-ink">{a.message}</p>
              {!a.read && (
                <button
                  onClick={() => actions.markActivityRead(a.id)}
                  className="mt-0.5 h-2 w-2 flex-none rounded-full bg-cyan"
                  aria-label="Mark as read"
                />
              )}
            </div>
            <div className="mt-1.5 text-[11px] uppercase tracking-wider text-ink-faint">{timeAgo(a.at)}</div>
          </li>
        ))}
      </ul>
    </Overlay>
  );
}

export function NotificationBell({ onClick }: { onClick: () => void }) {
  const state = useAppState();
  const unread = state.activity.filter((a) => !a.read).length;
  return (
    <button
      onClick={onClick}
      aria-label={`Notifications, ${unread} unread`}
      className="relative rounded-lg border border-line p-2.5 text-ink-dim transition hover:border-line-strong hover:text-ink"
    >
      <Bell size={17} />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-race px-1 text-[10px] font-bold text-white">
          {unread}
        </span>
      )}
    </button>
  );
}

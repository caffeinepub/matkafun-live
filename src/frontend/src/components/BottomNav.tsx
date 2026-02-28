import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Flame, History, Home, User, Wallet } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Home", Icon: Home },
  { path: "/play", label: "Play", Icon: Flame },
  { path: "/wallet", label: "Wallet", Icon: Wallet },
  { path: "/history", label: "History", Icon: History },
  { path: "/profile", label: "Profile", Icon: User },
];

export function BottomNav() {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[480px]">
      <div
        className="flex items-stretch"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.10 0.005 260) 0%, oklch(0.08 0.003 260) 100%)",
          borderTop: "1px solid oklch(0.28 0.015 50 / 0.3)",
        }}
      >
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const isActive =
            path === "/" ? currentPath === "/" : currentPath.startsWith(path);

          return (
            <button
              type="button"
              key={path}
              onClick={() => navigate({ to: path })}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all duration-200 ${
                isActive
                  ? "text-fire"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-all duration-200 ${
                  isActive ? "drop-shadow-[0_0_6px_oklch(0.72_0.25_42)]" : ""
                }`}
              />
              <span
                className={`text-[10px] font-body font-medium ${
                  isActive ? "fire-text-glow" : ""
                }`}
              >
                {label}
              </span>
              {isActive && (
                <div
                  className="absolute bottom-0 w-10 h-0.5 bg-fire rounded-full"
                  style={{ boxShadow: "0 0 8px oklch(0.72 0.25 42 / 0.7)" }}
                />
              )}
            </button>
          );
        })}
      </div>
      {/* Safe area padding */}
      <div
        className="h-safe-bottom"
        style={{
          height: "env(safe-area-inset-bottom)",
          background: "oklch(0.08 0.003 260)",
        }}
      />
    </nav>
  );
}

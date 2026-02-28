import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Search } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { GameCard } from "../components/GameCard";
import { MatkaClockWidget } from "../components/MatkaClockWidget";
import { SEED_GAMES } from "../data/seedGames";
import { useGetGames } from "../hooks/useQueries";

const SESSION_TABS = ["All", "Morning", "Day", "Night"] as const;
type SessionTab = (typeof SESSION_TABS)[number];

export function HomePage() {
  const { data: liveGames, isLoading } = useGetGames();
  const [activeTab, setActiveTab] = useState<SessionTab>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const games = liveGames && liveGames.length > 0 ? liveGames : SEED_GAMES;

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const matchSession = activeTab === "All" || g.session === activeTab;
      const matchSearch = g.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchSession && matchSearch;
    });
  }, [games, activeTab, searchQuery]);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.09 0 0) 0%, oklch(0.09 0 0 / 0.95) 100%)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid oklch(0.25 0.01 260)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img
              src="/assets/generated/matka-logo-transparent.dim_400x120.png"
              alt="MatkaFun"
              className="h-8 object-contain"
              style={{
                filter: "drop-shadow(0 0 8px oklch(0.72 0.25 42 / 0.5))",
              }}
            />
          </div>
          <div className="flex items-center gap-3">
            <MatkaClockWidget />
            <button
              type="button"
              className="relative p-2 rounded-lg hover:bg-secondary/60 transition-colors"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-fire animate-pulse" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-secondary/60 border-border/40 text-sm h-9 placeholder:text-muted-foreground/50"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Session tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {SESSION_TABS.map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                activeTab === tab
                  ? "bg-fire text-primary-foreground border-fire/50 glow-fire"
                  : "bg-secondary/40 text-muted-foreground border-border/40 hover:border-border"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Live ticker banner */}
      <div
        className="px-4 py-2 flex items-center gap-2 overflow-hidden"
        style={{
          background: "oklch(0.15 0.04 42 / 0.3)",
          borderBottom: "1px solid oklch(0.35 0.1 42 / 0.3)",
        }}
      >
        <span className="shrink-0 text-[10px] font-bold text-fire uppercase tracking-widest">
          ● LIVE
        </span>
        <div className="text-xs text-amber-200/70 truncate">
          ✦ Kalyan: 234-43-789 &nbsp;✦ Main Bazar: Open Soon &nbsp;✦ Milan Day:
          378-47-890 &nbsp;✦ Rajdhani Night: Open Soon
        </div>
      </div>

      {/* Welcome balance banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="mx-4 mt-4 rounded-xl p-4 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.18 0.06 42) 0%, oklch(0.14 0.04 42) 100%)",
          border: "1px solid oklch(0.35 0.1 42 / 0.5)",
        }}
      >
        <div>
          <p className="text-xs text-amber-300/70 font-body">Welcome Bonus</p>
          <p className="text-2xl font-display font-black text-gold number-glow">
            ₹1,000
          </p>
          <p className="text-[11px] text-amber-200/60 mt-0.5">
            Auto-credited on registration
          </p>
        </div>
        <div className="text-4xl">🎯</div>
      </motion.div>

      {/* Games list */}
      <main className="px-4 mt-4 space-y-3">
        {isLoading ? (
          <>
            {["s1", "s2", "s3", "s4", "s5"].map((k) => (
              <div
                key={k}
                className="rounded-xl overflow-hidden"
                style={{ background: "oklch(0.13 0.005 260)" }}
              >
                <Skeleton className="h-40 bg-muted/30" />
              </div>
            ))}
          </>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-body">No games found</p>
          </div>
        ) : (
          filteredGames.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 px-4 mt-8">
        <p className="text-xs text-muted-foreground/40 font-body">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-fire/60 hover:text-fire transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

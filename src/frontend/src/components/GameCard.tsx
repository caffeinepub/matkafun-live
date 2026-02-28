import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { BarChart2, ChevronRight, Flame, Grid } from "lucide-react";
import { motion } from "motion/react";
import type { Game, GameResult } from "../backend.d";
import { SEED_RESULTS } from "../data/seedGames";
import { useGetGameResult } from "../hooks/useQueries";

interface GameCardProps {
  game: Game;
  index?: number;
}

function timestampToTime(ts: bigint): string {
  const d = new Date(Number(ts) * 1000);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function sessionColor(session: string) {
  if (session === "Morning")
    return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  if (session === "Day") return "bg-sky-500/20 text-sky-300 border-sky-500/30";
  return "bg-violet-500/20 text-violet-300 border-violet-500/30";
}

function ResultDisplay({ result }: { result: GameResult | null | undefined }) {
  if (!result) {
    return (
      <div className="text-center py-2">
        <span className="font-mono text-2xl font-black text-muted-foreground/40 tracking-widest">
          ***-**-***
        </span>
        <p className="text-xs text-muted-foreground/50 mt-1">Awaiting result</p>
      </div>
    );
  }

  const { panelOpen, jodiNumber, panelClose } = result;

  return (
    <div className="text-center py-1">
      <div className="result-numbers text-3xl font-black tracking-wider number-glow">
        <span className="text-amber-300">{panelOpen || "***"}</span>
        <span className="text-white/40 mx-1">-</span>
        <span className="text-gold">{jodiNumber || "**"}</span>
        <span className="text-white/40 mx-1">-</span>
        <span className="text-amber-300">{panelClose || "***"}</span>
      </div>
      <div className="flex justify-center gap-6 mt-1">
        <span className="text-xs text-muted-foreground">
          Open:{" "}
          <span className="text-fire font-bold">
            {result.openNumber || "*"}
          </span>
        </span>
        <span className="text-xs text-muted-foreground">
          Close:{" "}
          <span className="text-fire font-bold">
            {result.closeNumber || "*"}
          </span>
        </span>
      </div>
    </div>
  );
}

export function GameCard({ game, index = 0 }: GameCardProps) {
  const navigate = useNavigate();
  const { data: liveResult, isLoading } = useGetGameResult(game.id);
  // Fall back to seed data if backend returns nothing
  const result = liveResult ?? SEED_RESULTS[game.id] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <div className="matka-card matka-card-hover rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-fire animate-flicker shrink-0" />
            <span className="font-display font-bold text-sm uppercase tracking-wide text-foreground">
              {game.name}
            </span>
          </div>
          <Badge
            className={`text-[10px] px-2 py-0.5 border ${sessionColor(game.session)}`}
            variant="outline"
          >
            {game.session}
          </Badge>
        </div>

        {/* Result numbers */}
        <div className="px-4 py-3">
          {isLoading ? (
            <div className="flex justify-center gap-3 py-2">
              <Skeleton className="h-8 w-24 bg-muted/40" />
              <Skeleton className="h-8 w-8 bg-muted/40" />
              <Skeleton className="h-8 w-24 bg-muted/40" />
            </div>
          ) : (
            <ResultDisplay result={result} />
          )}
        </div>

        {/* Times */}
        <div className="flex justify-center gap-6 px-4 pb-2">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Open
            </p>
            <p className="text-sm font-bold text-foreground/80">
              {timestampToTime(game.openTime)}
            </p>
          </div>
          <div className="w-px bg-border/50" />
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Close
            </p>
            <p className="text-sm font-bold text-foreground/80">
              {timestampToTime(game.closeTime)}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 px-3 pb-3 pt-1">
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-sky-400 hover:bg-sky-400/10 transition-colors"
          >
            <Grid className="w-3 h-3" />
            Jodi Chart
          </button>
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-emerald-400 hover:bg-emerald-400/10 transition-colors"
          >
            <BarChart2 className="w-3 h-3" />
            Panna Chart
          </button>
          <div className="flex-1" />
          <Button
            size="sm"
            className="h-8 px-4 text-xs font-bold bg-fire hover:bg-fire/90 text-primary-foreground glow-fire"
            onClick={() => navigate({ to: `/play/${game.id}` })}
          >
            Play
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

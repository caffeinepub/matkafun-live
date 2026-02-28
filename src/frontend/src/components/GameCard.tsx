import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { BarChart2, ChevronRight, Flame, Grid } from "lucide-react";
import { motion } from "motion/react";
import type { Game, GameResult } from "../backend.d";
import { SEED_RESULTS } from "../data/seedGames";
import { useMatkaTime } from "../hooks/useMatkaTime";
import { useGetGameResult } from "../hooks/useQueries";

interface GameCardProps {
  game: Game;
  index?: number;
}

/** Convert bigint unix-seconds timestamp → total minutes since midnight */
function tsToMinutes(ts: bigint): number {
  const d = new Date(Number(ts) * 1000);
  return d.getHours() * 60 + d.getMinutes();
}

function sessionColor(session: string) {
  if (session === "Morning")
    return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  if (session === "Day") return "bg-sky-500/20 text-sky-300 border-sky-500/30";
  return "bg-violet-500/20 text-violet-300 border-violet-500/30";
}

type MarketStatus = "OPEN" | "RESULT_SOON" | "CLOSED";

function getMarketStatus(
  matkaTime: Date,
  openTime: bigint,
  closeTime: bigint,
): MarketStatus {
  const nowMin = matkaTime.getHours() * 60 + matkaTime.getMinutes();
  const openMin = tsToMinutes(openTime);
  const closeMin = tsToMinutes(closeTime);

  // Handle overnight close (e.g. 21:30 open → 00:30 close)
  // If closeMin < openMin, it wraps past midnight
  const effectiveCloseMin = closeMin < openMin ? closeMin + 24 * 60 : closeMin;
  // If nowMin is before openMin but very large, it might be the "next day" portion
  const effectiveNowMin =
    closeMin < openMin && nowMin < openMin ? nowMin + 24 * 60 : nowMin;

  if (effectiveNowMin >= openMin && effectiveNowMin < effectiveCloseMin) {
    return "OPEN";
  }
  if (
    effectiveNowMin >= effectiveCloseMin &&
    effectiveNowMin < effectiveCloseMin + 15
  ) {
    return "RESULT_SOON";
  }
  return "CLOSED";
}

function StatusBadge({ status }: { status: MarketStatus }) {
  if (status === "OPEN") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-green-500/20 text-green-400 border-green-500/40">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
        OPEN
      </span>
    );
  }
  if (status === "RESULT_SOON") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
        RESULT SOON
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-gray-500/10 text-gray-500 border-gray-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-600 shrink-0" />
      CLOSED
    </span>
  );
}

function timestampToTime(ts: bigint): string {
  const d = new Date(Number(ts) * 1000);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
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
  const matkaTime = useMatkaTime();

  const status = getMarketStatus(matkaTime, game.openTime, game.closeTime);

  // Show result based on clock status:
  // - liveResult from admin takes priority
  // - CLOSED games show seed results
  // - OPEN/upcoming games show "***-**-***"
  const result =
    liveResult ??
    (status === "CLOSED" ? (SEED_RESULTS[game.id] ?? null) : null);

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
            <Flame
              className={`w-4 h-4 shrink-0 ${status === "OPEN" ? "text-green-400 animate-flicker" : "text-fire animate-flicker"}`}
            />
            <span className="font-display font-bold text-sm uppercase tracking-wide text-foreground">
              {game.name}
            </span>
            {status === "OPEN" && (
              <span
                className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0"
                title="Market is open"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <Badge
              className={`text-[10px] px-2 py-0.5 border ${sessionColor(game.session)}`}
              variant="outline"
            >
              {game.session}
            </Badge>
          </div>
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

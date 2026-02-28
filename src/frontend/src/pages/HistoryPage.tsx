import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Loader2, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { BetStatus } from "../backend.d";
import { SEED_GAMES } from "../data/seedGames";
import { useGetBets } from "../hooks/useQueries";

function getGameName(gameId: string): string {
  const game = SEED_GAMES.find((g) => g.id === gameId);
  return game?.name ?? gameId.toUpperCase().replace(/-/g, " ");
}

function StatusBadge({ status }: { status: BetStatus | string }) {
  if (status === BetStatus.won || status === "won") {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs px-2 py-0">
        Won
      </Badge>
    );
  }
  if (status === BetStatus.lost || status === "lost") {
    return (
      <Badge className="bg-destructive/20 text-destructive border-destructive/30 border text-xs px-2 py-0">
        Lost
      </Badge>
    );
  }
  return (
    <Badge className="bg-warning/20 text-warning border-warning/30 border text-xs px-2 py-0">
      Pending
    </Badge>
  );
}

const MOCK_BETS = [
  {
    id: 1n,
    gameId: "kalyan",
    betType: "jodi",
    betNumber: "43",
    amount: 100n,
    status: BetStatus.won,
    userId: null as unknown as any,
  },
  {
    id: 2n,
    gameId: "milan-day",
    betType: "open",
    betNumber: "5",
    amount: 50n,
    status: BetStatus.lost,
    userId: null as unknown as any,
  },
  {
    id: 3n,
    gameId: "rajdhani-day",
    betType: "panel",
    betNumber: "135",
    amount: 200n,
    status: BetStatus.pending,
    userId: null as unknown as any,
  },
  {
    id: 4n,
    gameId: "star-tara-morning",
    betType: "close",
    betNumber: "7",
    amount: 150n,
    status: BetStatus.won,
    userId: null as unknown as any,
  },
  {
    id: 5n,
    gameId: "sridevi",
    betType: "jodi",
    betNumber: "63",
    amount: 500n,
    status: BetStatus.pending,
    userId: null as unknown as any,
  },
];

export function HistoryPage() {
  const { data: liveBets, isLoading, refetch, isFetching } = useGetBets();
  const bets = liveBets && liveBets.length > 0 ? liveBets : MOCK_BETS;

  const wonBets = bets.filter((b) => b.status === BetStatus.won);
  const totalWon = wonBets.reduce((acc, b) => acc + Number(b.amount) * 9, 0);
  const totalBet = bets.reduce((acc, b) => acc + Number(b.amount), 0);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-4"
        style={{
          background: "oklch(0.09 0 0 / 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid oklch(0.25 0.01 260)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-fire" />
            <h1 className="font-display font-black text-xl">Bet History</h1>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-lg hover:bg-secondary/60 transition-colors"
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="mx-4 mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Total Bets", value: bets.length, color: "text-foreground" },
          { label: "Total Staked", value: `₹${totalBet}`, color: "text-fire" },
          {
            label: "Won Amount",
            value: `₹${totalWon}`,
            color: "text-emerald-400",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-3 text-center"
            style={{
              background: "oklch(0.13 0.005 260)",
              border: "1px solid oklch(0.25 0.01 260)",
            }}
          >
            <p className={`text-lg font-display font-black ${color}`}>
              {value}
            </p>
            <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wide mt-0.5">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Bets list */}
      <div className="px-4 mt-4 space-y-2">
        {isLoading ? (
          <>
            {["s1", "s2", "s3", "s4", "s5"].map((k) => (
              <Skeleton key={k} className="h-20 rounded-xl bg-muted/30" />
            ))}
          </>
        ) : bets.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{
              background: "oklch(0.13 0.005 260)",
              border: "1px solid oklch(0.25 0.01 260)",
            }}
          >
            <p className="text-3xl mb-3">🎲</p>
            <p className="text-foreground font-body font-medium">
              No bets placed yet
            </p>
            <p className="text-sm text-muted-foreground mt-1 font-body">
              Start playing to see your bet history
            </p>
          </div>
        ) : (
          bets.map((bet, i) => (
            <motion.div
              key={Number(bet.id)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-4"
              style={{
                background: "oklch(0.13 0.005 260)",
                border: "1px solid oklch(0.25 0.01 260)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm uppercase truncate text-foreground">
                    {getGameName(bet.gameId)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground font-body capitalize">
                      {bet.betType}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="font-mono font-bold text-sm text-gold number-glow">
                      {bet.betNumber}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge status={bet.status} />
                  <span className="font-display font-bold text-sm text-fire">
                    ₹{Number(bet.amount)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

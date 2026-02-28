import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import { motion } from "motion/react";
import { SEED_GAMES } from "../data/seedGames";
import type { LocalWithdrawal } from "../hooks/useLocalWallet";
import { useLocalWallet } from "../hooks/useLocalWallet";

function getGameName(gameId: string): string {
  const game = SEED_GAMES.find((g) => g.id === gameId);
  return game?.name ?? gameId.toUpperCase().replace(/-/g, " ");
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function WithdrawalHistoryRow({ wd }: { wd: LocalWithdrawal }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-xl p-4"
      style={{
        background: "oklch(0.13 0.005 260)",
        border: "1px solid oklch(0.25 0.01 260)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm uppercase truncate text-foreground">
            Withdrawal
          </p>
          <p className="text-xs text-muted-foreground font-body mt-0.5 truncate">
            {wd.method}
          </p>
          <p className="text-xs text-muted-foreground/60 font-body mt-0.5">
            {formatDate(wd.timestamp)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs px-2 py-0">
            APPROVED
          </Badge>
          <span className="font-display font-bold text-sm text-destructive">
            -₹{wd.amount.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Kept for demonstration — mock bets to show history page isn't empty
const DEMO_BETS = [
  {
    id: 1,
    gameName: getGameName("kalyan"),
    betType: "Jodi",
    betNumber: "43",
    amount: 100,
    status: "won",
  },
  {
    id: 2,
    gameName: getGameName("milan-day"),
    betType: "Open",
    betNumber: "5",
    amount: 50,
    status: "lost",
  },
  {
    id: 3,
    gameName: getGameName("rajdhani-day"),
    betType: "Panel",
    betNumber: "135",
    amount: 200,
    status: "pending",
  },
  {
    id: 4,
    gameName: getGameName("star-tara-morning"),
    betType: "Close",
    betNumber: "7",
    amount: 150,
    status: "won",
  },
  {
    id: 5,
    gameName: getGameName("sridevi"),
    betType: "Jodi",
    betNumber: "63",
    amount: 500,
    status: "pending",
  },
];

function BetStatusBadge({ status }: { status: string }) {
  if (status === "won") {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs px-2 py-0">
        Won
      </Badge>
    );
  }
  if (status === "lost") {
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

export function HistoryPage() {
  const { withdrawals } = useLocalWallet();

  const totalBet = DEMO_BETS.reduce((acc, b) => acc + b.amount, 0);
  const wonBets = DEMO_BETS.filter((b) => b.status === "won");
  const totalWon = wonBets.reduce((acc, b) => acc + b.amount * 9, 0);

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
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-fire" />
          <h1 className="font-display font-black text-xl">History</h1>
        </div>
      </header>

      {/* Stats */}
      <div className="mx-4 mt-4 grid grid-cols-3 gap-3">
        {[
          {
            label: "Total Bets",
            value: DEMO_BETS.length,
            color: "text-foreground",
          },
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

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <div className="px-4 mt-5">
          <h2 className="font-display font-bold text-base mb-3 text-emerald-400">
            Withdrawal History
          </h2>
          <div className="space-y-2">
            {withdrawals.map((wd) => (
              <WithdrawalHistoryRow key={wd.id} wd={wd} />
            ))}
          </div>
        </div>
      )}

      {/* Bet History */}
      <div className="px-4 mt-5 space-y-2">
        <h2 className="font-display font-bold text-base mb-3">Bet History</h2>
        {DEMO_BETS.map((bet, i) => (
          <motion.div
            key={bet.id}
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
                  {bet.gameName}
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
                <BetStatusBadge status={bet.status} />
                <span className="font-display font-bold text-sm text-fire">
                  ₹{bet.amount}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

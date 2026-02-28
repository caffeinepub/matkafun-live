import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Flame, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SEED_GAMES, SEED_RESULTS } from "../data/seedGames";
import {
  getSessionToken,
  useGetGame,
  useGetGameResult,
  useGetWalletBalance,
  usePlaceBet,
} from "../hooks/useQueries";

type BetType = "open" | "close" | "jodi" | "panel";

const BET_MULTIPLIERS: Record<BetType, number> = {
  open: 9,
  close: 9,
  jodi: 90,
  panel: 150,
};

const BET_DESCRIPTIONS: Record<BetType, string> = {
  open: "Guess the open single digit (0-9). Win 9x",
  close: "Guess the close single digit (0-9). Win 9x",
  jodi: "Guess the 2-digit jodi number (00-99). Win 90x",
  panel: "Guess the 3-digit panel number. Win 150x",
};

export function PlayPage() {
  const { gameId } = useParams({ from: "/play/$gameId" });
  const navigate = useNavigate();

  const { data: liveGame, isLoading: gameLoading } = useGetGame(gameId);
  const { data: liveResult } = useGetGameResult(gameId);
  const { data: walletBalance = 0n } = useGetWalletBalance();

  const seedGame = SEED_GAMES.find((g) => g.id === gameId);
  const game = liveGame ?? seedGame ?? null;
  const result = liveResult ?? SEED_RESULTS[gameId] ?? null;

  const [betType, setBetType] = useState<BetType>("open");
  const [betNumber, setBetNumber] = useState("");
  const [betAmount, setBetAmount] = useState("100");
  const [showConfirm, setShowConfirm] = useState(false);

  const placeBetMutation = usePlaceBet();

  const potentialWin = useMemo(() => {
    const amount = Number.parseInt(betAmount) || 0;
    return amount * BET_MULTIPLIERS[betType];
  }, [betAmount, betType]);

  const balanceNum = Number(walletBalance);

  function validate(): string | null {
    if (!getSessionToken()) return "Bet lagane ke liye pehle login karein";
    const amount = Number.parseInt(betAmount);
    if (!betNumber.trim()) return "Please enter a bet number";
    if (Number.isNaN(amount) || amount < 10) return "Minimum bet amount is ₹10";
    if (amount > balanceNum) return "Insufficient wallet balance";
    if (betType === "open" || betType === "close") {
      if (!/^\d$/.test(betNumber))
        return "Enter a single digit (0-9) for open/close";
    }
    if (betType === "jodi") {
      if (!/^\d{2}$/.test(betNumber))
        return "Enter a 2-digit number (00-99) for jodi";
    }
    if (betType === "panel") {
      if (!/^\d{3}$/.test(betNumber)) return "Enter a 3-digit panel number";
    }
    return null;
  }

  function handlePlayClick() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setShowConfirm(true);
  }

  async function handleConfirmBet() {
    setShowConfirm(false);
    try {
      await placeBetMutation.mutateAsync({
        gameId,
        betType,
        betNumber,
        amount: BigInt(Number.parseInt(betAmount)),
      });
      toast.success(`Bet placed! ₹${betAmount} on ${betNumber}`);
      setBetNumber("");
      setBetAmount("100");
    } catch {
      toast.error("Failed to place bet. Please try again.");
    }
  }

  if (gameLoading) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4">
        <Skeleton className="h-12 w-full bg-muted/30 rounded-xl mb-4" />
        <Skeleton className="h-32 w-full bg-muted/30 rounded-xl mb-4" />
        <Skeleton className="h-64 w-full bg-muted/30 rounded-xl" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <p className="text-foreground font-body">Game not found</p>
          <Button className="mt-4" onClick={() => navigate({ to: "/" })}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3"
        style={{
          background: "oklch(0.09 0 0 / 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid oklch(0.25 0.01 260)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="p-2 rounded-lg hover:bg-secondary/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-base uppercase tracking-wide">
            {game.name}
          </h1>
          <p className="text-xs text-muted-foreground font-body">
            {game.session} Session
          </p>
        </div>
        <Flame className="w-5 h-5 text-fire animate-flicker" />
      </header>

      {/* Current result */}
      <div
        className="mx-4 mt-4 rounded-xl p-4 text-center"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.14 0.008 250) 0%, oklch(0.12 0.005 270) 100%)",
          border: "1px solid oklch(0.28 0.015 50 / 0.4)",
        }}
      >
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
          Today's Result
        </p>
        {result ? (
          <div className="result-numbers text-4xl font-black tracking-wider number-glow">
            <span className="text-amber-300">{result.panelOpen}</span>
            <span className="text-white/40 mx-2">-</span>
            <span className="text-gold">{result.jodiNumber}</span>
            <span className="text-white/40 mx-2">-</span>
            <span className="text-amber-300">{result.panelClose}</span>
          </div>
        ) : (
          <span className="result-numbers text-4xl font-black text-muted-foreground/30">
            ***-**-***
          </span>
        )}
      </div>

      {/* Wallet balance */}
      <div
        className="mx-4 mt-3 px-4 py-2 rounded-lg flex items-center justify-between"
        style={{
          background: "oklch(0.15 0.005 260)",
          border: "1px solid oklch(0.25 0.01 260)",
        }}
      >
        <span className="text-sm text-muted-foreground font-body">
          Wallet Balance
        </span>
        <span className="font-display font-black text-gold text-lg">
          ₹{balanceNum.toLocaleString("en-IN")}
        </span>
      </div>

      {/* Bet form */}
      <div className="px-4 mt-4">
        <Tabs
          value={betType}
          onValueChange={(v) => {
            setBetType(v as BetType);
            setBetNumber("");
          }}
        >
          <TabsList
            className="grid grid-cols-4 w-full h-10"
            style={{
              background: "oklch(0.14 0.005 260)",
              border: "1px solid oklch(0.25 0.01 260)",
            }}
          >
            {(["open", "close", "jodi", "panel"] as BetType[]).map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="text-xs font-bold capitalize data-[state=active]:bg-fire data-[state=active]:text-primary-foreground"
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {(["open", "close", "jodi", "panel"] as BetType[]).map((t) => (
            <TabsContent key={t} value={t} className="mt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={t}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Description */}
                  <div
                    className="p-3 rounded-lg text-sm text-amber-200/70"
                    style={{
                      background: "oklch(0.16 0.04 42 / 0.3)",
                      border: "1px solid oklch(0.35 0.1 42 / 0.3)",
                    }}
                  >
                    🎯 {BET_DESCRIPTIONS[t]}
                  </div>

                  {/* Bet number */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground font-body">
                      {t === "open" || t === "close"
                        ? "Digit (0-9)"
                        : t === "jodi"
                          ? "Jodi Number (00-99)"
                          : "Panel Number (000-999)"}
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={
                        t === "open" || t === "close" ? 1 : t === "jodi" ? 2 : 3
                      }
                      value={betNumber}
                      onChange={(e) =>
                        setBetNumber(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder={
                        t === "open" || t === "close"
                          ? "e.g. 5"
                          : t === "jodi"
                            ? "e.g. 47"
                            : "e.g. 234"
                      }
                      className="text-xl font-display font-bold text-gold h-14 tracking-widest text-center bg-secondary/60 border-border/40"
                    />
                  </div>

                  {/* Bet amount */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground font-body">
                      Bet Amount (₹)
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={betAmount}
                      onChange={(e) =>
                        setBetAmount(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="Min ₹10"
                      className="h-12 text-lg font-bold text-foreground bg-secondary/60 border-border/40 text-center"
                    />
                    {/* Quick amounts */}
                    <div className="flex gap-2">
                      {[50, 100, 200, 500].map((amt) => (
                        <button
                          type="button"
                          key={amt}
                          onClick={() => setBetAmount(String(amt))}
                          className={`flex-1 py-1.5 rounded text-xs font-bold transition-all border ${
                            betAmount === String(amt)
                              ? "bg-fire text-primary-foreground border-fire/50"
                              : "bg-secondary/40 text-muted-foreground border-border/40 hover:border-border"
                          }`}
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Potential win */}
                  <div
                    className="p-3 rounded-xl flex items-center justify-between"
                    style={{
                      background: "oklch(0.15 0.04 160 / 0.2)",
                      border: "1px solid oklch(0.4 0.1 160 / 0.3)",
                    }}
                  >
                    <span className="text-sm text-emerald-400/80 font-body">
                      Potential Win
                    </span>
                    <span className="text-xl font-display font-black text-emerald-400 glow-green">
                      ₹{potentialWin.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Place bet button */}
                  <Button
                    size="lg"
                    className="w-full h-14 text-base font-display font-black bg-fire hover:bg-fire/90 text-primary-foreground glow-fire"
                    onClick={handlePlayClick}
                    disabled={placeBetMutation.isPending}
                  >
                    {placeBetMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />{" "}
                        Placing Bet...
                      </>
                    ) : (
                      `Place Bet — ₹${Number.parseInt(betAmount) || 0}`
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-popover border-border max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Confirm Bet
            </DialogTitle>
            <DialogDescription className="font-body text-muted-foreground">
              Review your bet before confirming
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {[
              { label: "Game", value: game.name },
              { label: "Bet Type", value: betType.toUpperCase() },
              { label: "Number", value: betNumber },
              { label: "Amount", value: `₹${Number.parseInt(betAmount) || 0}` },
              { label: "Multiplier", value: `${BET_MULTIPLIERS[betType]}x` },
              {
                label: "Max Win",
                value: `₹${potentialWin.toLocaleString("en-IN")}`,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between py-1.5 border-b border-border/30"
              >
                <span className="text-sm text-muted-foreground font-body">
                  {label}
                </span>
                <span
                  className={`font-bold text-sm ${label === "Max Win" ? "text-emerald-400" : label === "Amount" ? "text-fire" : "text-foreground"}`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 flex-row">
            <Button
              variant="outline"
              className="flex-1 border-border/50"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-fire hover:bg-fire/90 text-primary-foreground font-bold"
              onClick={handleConfirmBet}
              disabled={placeBetMutation.isPending}
            >
              {placeBetMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Confirm Bet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

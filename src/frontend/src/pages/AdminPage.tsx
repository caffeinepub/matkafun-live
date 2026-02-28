import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle,
  Loader2,
  Plus,
  Shield,
  Trophy,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WithdrawalStatus } from "../backend.d";
import { SEED_GAMES } from "../data/seedGames";
import {
  useAddGame,
  useAddGameResult,
  useApproveWithdrawal,
  useGetGames,
  useGetWithdrawals,
  useIsAdmin,
  useRejectWithdrawal,
  useSettleBets,
  useUpdateGameResult,
} from "../hooks/useQueries";

function timeStrToTimestamp(t: string): bigint {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return BigInt(Math.floor(d.getTime() / 1000));
}

export function AdminPage() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: liveGames } = useGetGames();
  const { data: withdrawals = [], isLoading: wdLoading } = useGetWithdrawals();

  const addGameMutation = useAddGame();
  const addResultMutation = useAddGameResult();
  const updateResultMutation = useUpdateGameResult();
  const approveMutation = useApproveWithdrawal();
  const rejectMutation = useRejectWithdrawal();
  const settleMutation = useSettleBets();

  const games = liveGames && liveGames.length > 0 ? liveGames : SEED_GAMES;

  // Add game form
  const [gameName, setGameName] = useState("");
  const [gameSession, setGameSession] = useState("Morning");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("11:00");

  // Result form
  const [selectedGameId, setSelectedGameId] = useState("");
  const [openNum, setOpenNum] = useState("");
  const [closeNum, setCloseNum] = useState("");
  const [jodiNum, setJodiNum] = useState("");
  const [panelOpenNum, setPanelOpenNum] = useState("");
  const [panelCloseNum, setPanelCloseNum] = useState("");

  async function handleAddGame() {
    if (!gameName.trim()) {
      toast.error("Enter game name");
      return;
    }
    try {
      await addGameMutation.mutateAsync({
        id: crypto.randomUUID().slice(0, 8),
        name: gameName.toUpperCase(),
        session: gameSession,
        openTime: timeStrToTimestamp(openTime),
        closeTime: timeStrToTimestamp(closeTime),
      });
      toast.success("Game added!");
      setGameName("");
    } catch {
      toast.error("Failed to add game");
    }
  }

  async function handlePostResult() {
    if (!selectedGameId) {
      toast.error("Select a game");
      return;
    }
    if (!openNum || !closeNum || !jodiNum || !panelOpenNum || !panelCloseNum) {
      toast.error("Fill all result fields");
      return;
    }
    const result = {
      gameId: selectedGameId,
      openNumber: openNum,
      closeNumber: closeNum,
      jodiNumber: jodiNum,
      panelOpen: panelOpenNum,
      panelClose: panelCloseNum,
    };
    try {
      await updateResultMutation.mutateAsync({
        gameId: selectedGameId,
        result,
      });
      toast.success("Result posted!");
      setOpenNum("");
      setCloseNum("");
      setJodiNum("");
      setPanelOpenNum("");
      setPanelCloseNum("");
    } catch {
      try {
        await addResultMutation.mutateAsync(result);
        toast.success("Result posted!");
      } catch {
        toast.error("Failed to post result");
      }
    }
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 space-y-3">
        {["s1", "s2", "s3"].map((k) => (
          <Skeleton key={k} className="h-16 rounded-xl bg-muted/30" />
        ))}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display font-black text-xl text-foreground">
            Admin Access Required
          </h2>
          <p className="text-muted-foreground font-body text-sm mt-2">
            You don't have admin privileges.
          </p>
          <Button
            className="mt-4 bg-fire hover:bg-fire/90 text-primary-foreground"
            onClick={() => navigate({ to: "/" })}
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

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
          <Shield className="w-5 h-5 text-fire" />
          <h1 className="font-display font-black text-xl">Admin Panel</h1>
        </div>
      </header>

      <div className="px-4 mt-4">
        <Tabs defaultValue="games">
          <TabsList
            className="grid grid-cols-3 w-full"
            style={{
              background: "oklch(0.14 0.005 260)",
              border: "1px solid oklch(0.25 0.01 260)",
            }}
          >
            <TabsTrigger
              value="games"
              className="text-xs font-bold data-[state=active]:bg-fire data-[state=active]:text-primary-foreground"
            >
              Add Game
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="text-xs font-bold data-[state=active]:bg-fire data-[state=active]:text-primary-foreground"
            >
              Results
            </TabsTrigger>
            <TabsTrigger
              value="withdrawals"
              className="text-xs font-bold data-[state=active]:bg-fire data-[state=active]:text-primary-foreground"
            >
              Withdrawals
            </TabsTrigger>
          </TabsList>

          {/* Add game */}
          <TabsContent value="games" className="mt-4">
            <div
              className="p-4 rounded-xl space-y-4"
              style={{
                background: "oklch(0.13 0.005 260)",
                border: "1px solid oklch(0.25 0.01 260)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-4 h-4 text-fire" />
                <h3 className="font-display font-bold text-base">
                  Add New Game
                </h3>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-body">
                  Game Name
                </Label>
                <Input
                  className="bg-secondary/60 border-border/40 h-11 uppercase"
                  placeholder="e.g. KALYAN SPECIAL"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-body">
                  Session
                </Label>
                <Select value={gameSession} onValueChange={setGameSession}>
                  <SelectTrigger className="bg-secondary/60 border-border/40 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Morning", "Day", "Night"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-body">
                    Open Time
                  </Label>
                  <Input
                    type="time"
                    className="bg-secondary/60 border-border/40 h-11"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-body">
                    Close Time
                  </Label>
                  <Input
                    type="time"
                    className="bg-secondary/60 border-border/40 h-11"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full h-11 bg-fire hover:bg-fire/90 text-primary-foreground font-bold"
                onClick={handleAddGame}
                disabled={addGameMutation.isPending}
              >
                {addGameMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add Game"
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Post results */}
          <TabsContent value="results" className="mt-4 space-y-4">
            <div
              className="p-4 rounded-xl space-y-4"
              style={{
                background: "oklch(0.13 0.005 260)",
                border: "1px solid oklch(0.25 0.01 260)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-gold" />
                <h3 className="font-display font-bold text-base">
                  Post Game Result
                </h3>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-body">
                  Select Game
                </Label>
                <Select
                  value={selectedGameId}
                  onValueChange={setSelectedGameId}
                >
                  <SelectTrigger className="bg-secondary/60 border-border/40 h-11">
                    <SelectValue placeholder="Choose game..." />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "Open#",
                    value: openNum,
                    setter: setOpenNum,
                    max: 1,
                  },
                  {
                    label: "Jodi##",
                    value: jodiNum,
                    setter: setJodiNum,
                    max: 2,
                  },
                  {
                    label: "Close#",
                    value: closeNum,
                    setter: setCloseNum,
                    max: 1,
                  },
                ].map(({ label, value, setter, max }) => (
                  <div key={label} className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-body">
                      {label}
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={max}
                      className="bg-secondary/60 border-border/40 h-10 text-center font-bold text-gold"
                      placeholder={"0".repeat(max)}
                      value={value}
                      onChange={(e) =>
                        setter(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "Panel Open###",
                    value: panelOpenNum,
                    setter: setPanelOpenNum,
                  },
                  {
                    label: "Panel Close###",
                    value: panelCloseNum,
                    setter: setPanelCloseNum,
                  },
                ].map(({ label, value, setter }) => (
                  <div key={label} className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-body">
                      {label}
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      className="bg-secondary/60 border-border/40 h-10 text-center font-bold text-amber-300"
                      placeholder="000"
                      value={value}
                      onChange={(e) =>
                        setter(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </div>
                ))}
              </div>

              <Button
                className="w-full h-11 bg-gold hover:bg-gold/90 text-primary-foreground font-bold"
                onClick={handlePostResult}
                disabled={
                  addResultMutation.isPending || updateResultMutation.isPending
                }
              >
                {addResultMutation.isPending ||
                updateResultMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...
                  </>
                ) : (
                  "Post Result"
                )}
              </Button>
            </div>

            {/* Settle bets */}
            <div
              className="p-4 rounded-xl space-y-3"
              style={{
                background: "oklch(0.13 0.005 260)",
                border: "1px solid oklch(0.25 0.01 260)",
              }}
            >
              <h3 className="font-display font-bold text-sm">Settle Bets</h3>
              <div className="grid grid-cols-1 gap-2">
                {games.slice(0, 8).map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between py-1.5 border-b border-border/20"
                  >
                    <span className="text-xs font-body text-foreground/70 truncate flex-1">
                      {g.name}
                    </span>
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs ml-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                      onClick={() =>
                        settleMutation.mutate(g.id, {
                          onSuccess: () => toast.success(`Settled: ${g.name}`),
                        })
                      }
                      disabled={settleMutation.isPending}
                    >
                      Settle
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Withdrawals */}
          <TabsContent value="withdrawals" className="mt-4">
            {wdLoading ? (
              <>
                {["s1", "s2", "s3"].map((k) => (
                  <Skeleton
                    key={k}
                    className="h-24 rounded-xl bg-muted/30 mb-3"
                  />
                ))}
              </>
            ) : withdrawals.length === 0 ? (
              <div
                className="rounded-xl p-8 text-center"
                style={{
                  background: "oklch(0.13 0.005 260)",
                  border: "1px solid oklch(0.25 0.01 260)",
                }}
              >
                <p className="text-muted-foreground font-body text-sm">
                  No withdrawal requests
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((wd) => (
                  <div
                    key={Number(wd.id)}
                    className="p-4 rounded-xl"
                    style={{
                      background: "oklch(0.13 0.005 260)",
                      border: "1px solid oklch(0.25 0.01 260)",
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-sm text-foreground font-body">
                          ₹{Number(wd.amount).toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 font-body">
                          {wd.method.__kind__ === "upi"
                            ? `UPI: ${wd.method.upi}`
                            : `Bank: ${wd.method.bank[0]}`}
                        </p>
                      </div>
                      <Badge
                        className={`text-xs border ${
                          wd.status === WithdrawalStatus.approved
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : wd.status === WithdrawalStatus.rejected
                              ? "bg-destructive/20 text-destructive border-destructive/30"
                              : "bg-warning/20 text-warning border-warning/30"
                        }`}
                        variant="outline"
                      >
                        {wd.status}
                      </Badge>
                    </div>
                    {wd.status === WithdrawalStatus.pending && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                          onClick={() =>
                            approveMutation.mutate(wd.id, {
                              onSuccess: () =>
                                toast.success("Withdrawal approved"),
                            })
                          }
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-bold"
                          onClick={() =>
                            rejectMutation.mutate(wd.id, {
                              onSuccess: () =>
                                toast.success("Withdrawal rejected"),
                            })
                          }
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

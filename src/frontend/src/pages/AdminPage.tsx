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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Shield, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SEED_GAMES } from "../data/seedGames";
import {
  useAddGame,
  useAddGameResult,
  useGetGames,
  useUpdateGameResult,
} from "../hooks/useQueries";

function timeStrToTimestamp(t: string): bigint {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return BigInt(Math.floor(d.getTime() / 1000));
}

export function AdminPage() {
  const { data: liveGames } = useGetGames();

  const addGameMutation = useAddGame();
  const addResultMutation = useAddGameResult();
  const updateResultMutation = useUpdateGameResult();

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
            className="grid grid-cols-2 w-full"
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
              Post Results
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Game, GameResult } from "../backend.d";
import { useActor } from "./useActor";

// ── Games ────────────────────────────────────────────────────────────────────

export function useGetGames() {
  const { actor, isFetching } = useActor();
  return useQuery<Game[]>({
    queryKey: ["games"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getGames();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetGame(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Game | null>({
    queryKey: ["game", id],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getGame(id);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useGetGameResult(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<GameResult | null>({
    queryKey: ["gameResult", id],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getGameResult(id);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!id,
    staleTime: 15_000,
  });
}

// ── Admin Queries ─────────────────────────────────────────────────────────────

export function useGetAllWithdrawals() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allWithdrawals"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllWithdrawals();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Game Mutations ─────────────────────────────────────────────────────────────

export function useAddGame() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (game: Game) => {
      if (!actor) throw new Error("Not connected");
      await actor.addGame(game);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

export function useAddGameResult() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (result: GameResult) => {
      if (!actor) throw new Error("Not connected");
      await actor.addGameResult(result);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["gameResult", vars.gameId] });
    },
  });
}

export function useUpdateGameResult() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      result,
    }: {
      gameId: string;
      result: GameResult;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.addGameResult(result);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["gameResult", vars.gameId] });
    },
  });
}

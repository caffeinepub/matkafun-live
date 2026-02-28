import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Bet,
  Game,
  GameResult,
  Transaction,
  UserProfile,
  Withdrawal,
} from "../backend.d";
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

// ── User ─────────────────────────────────────────────────────────────────────

export function useGetUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getCallerUserProfile();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetWalletBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["walletBalance"],
    queryFn: async () => {
      if (!actor) return 0n;
      try {
        return await actor.getWalletBalance();
      } catch {
        return 0n;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery<Transaction[]>({
    queryKey: ["userTransactions"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getUserTransactions();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetBets() {
  const { actor, isFetching } = useActor();
  return useQuery<Bet[]>({
    queryKey: ["bets"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getBets();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetWithdrawals() {
  const { actor, isFetching } = useActor();
  return useQuery<Withdrawal[]>({
    queryKey: ["withdrawals"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getWithdrawals();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useRegister() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      phone,
      password,
    }: {
      name: string;
      phone: string;
      password: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.register(name, phone, password);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["walletBalance"] });
    },
  });
}

export function useAddMoney() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.addMoney(amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["walletBalance"] });
      qc.invalidateQueries({ queryKey: ["userTransactions"] });
    },
  });
}

export function usePlaceBet() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      gameId,
      betType,
      betNumber,
      amount,
    }: {
      gameId: string;
      betType: string;
      betNumber: string;
      amount: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.placeBet(gameId, betType, betNumber, amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["walletBalance"] });
      qc.invalidateQueries({ queryKey: ["bets"] });
      qc.invalidateQueries({ queryKey: ["userTransactions"] });
    },
  });
}

export function useRequestWithdrawal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      method,
      details,
    }: {
      amount: bigint;
      method:
        | { __kind__: "upi"; upi: string }
        | { __kind__: "bank"; bank: [string, string, string] };
      details: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return await actor.requestWithdrawal(amount, method, details);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["walletBalance"] });
      qc.invalidateQueries({ queryKey: ["userTransactions"] });
    },
  });
}

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
      gameId,
      result,
    }: {
      gameId: string;
      result: GameResult;
    }) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateGameResult(gameId, result);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["gameResult", vars.gameId] });
    },
  });
}

export function useApproveWithdrawal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.approveWithdrawal(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
    },
  });
}

export function useRejectWithdrawal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.rejectWithdrawal(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
    },
  });
}

export function useSettleBets() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (gameId: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.settleBets(gameId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bets"] });
    },
  });
}

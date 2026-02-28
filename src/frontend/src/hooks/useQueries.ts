import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Bet,
  Game,
  GameResult,
  Transaction,
  Withdrawal,
} from "../backend.d";
import { useActor } from "./useActor";

// ── Session Token Helpers ────────────────────────────────────────────────────

const TOKEN_KEY = "matka_session_token";
const PROFILE_KEY = "matka_user_profile";

export function getSessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSessionToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSessionToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

export interface StoredProfile {
  name: string;
  phone: string;
}

export function getStoredProfile(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return null;
  }
}

export function setStoredProfile(profile: StoredProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// ── Auth State Hook ──────────────────────────────────────────────────────────

export function useAuthState() {
  const token = getSessionToken();
  const profile = getStoredProfile();
  return {
    token,
    isLoggedIn: !!token,
    profile,
  };
}

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

// ── User (Token-based) ────────────────────────────────────────────────────────

export function useGetUserProfile() {
  const { actor, isFetching } = useActor();
  const token = getSessionToken();
  return useQuery<StoredProfile | null>({
    queryKey: ["userProfile", token],
    queryFn: async () => {
      if (!token) return null;
      // Verify session is valid by checking wallet balance
      if (actor) {
        try {
          await actor.getWalletBalance(token);
        } catch {
          // Token invalid - clear it
          clearSessionToken();
          return null;
        }
      }
      return getStoredProfile();
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

export function useGetWalletBalance() {
  const { actor, isFetching } = useActor();
  const token = getSessionToken();
  return useQuery<bigint>({
    queryKey: ["walletBalance", token],
    queryFn: async () => {
      if (!actor || !token) return 0n;
      try {
        return await actor.getWalletBalance(token);
      } catch {
        return 0n;
      }
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

export function useGetUserTransactions() {
  const { actor, isFetching } = useActor();
  const token = getSessionToken();
  return useQuery<Transaction[]>({
    queryKey: ["userTransactions", token],
    queryFn: async () => {
      if (!actor || !token) return [];
      try {
        return await actor.getTransactions(token);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

export function useGetBets() {
  const { actor, isFetching } = useActor();
  const token = getSessionToken();
  return useQuery<Bet[]>({
    queryKey: ["bets", token],
    queryFn: async () => {
      if (!actor || !token) return [];
      try {
        return await actor.getBets(token);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const token = getSessionToken();
  return useQuery<boolean>({
    queryKey: ["isAdmin", token],
    queryFn: async () => {
      if (!actor || !token) return false;
      try {
        return await actor.isAdminCheck(token);
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

export function useGetWithdrawals() {
  const { actor, isFetching } = useActor();
  const token = getSessionToken();
  return useQuery<Withdrawal[]>({
    queryKey: ["withdrawals", token],
    queryFn: async () => {
      if (!actor || !token) return [];
      try {
        return await actor.getWithdrawals(token);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!token,
  });
}

// ── Admin Queries ─────────────────────────────────────────────────────────────

export function useGetAllWithdrawals() {
  const { actor, isFetching } = useActor();
  return useQuery<Withdrawal[]>({
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

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useLogin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      phone,
      password,
    }: {
      phone: string;
      password: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const token = await actor.login(phone, password);
      setSessionToken(token);
      // Store partial profile with phone (name unknown on login)
      const existing = getStoredProfile();
      if (!existing || existing.phone !== phone) {
        setStoredProfile({ name: "", phone });
      }
      return token;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["walletBalance"] });
      qc.invalidateQueries({ queryKey: ["isAdmin"] });
      qc.invalidateQueries({ queryKey: ["bets"] });
      qc.invalidateQueries({ queryKey: ["userTransactions"] });
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
    },
  });
}

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
      const token = await actor.register(name, phone, password);
      setSessionToken(token);
      setStoredProfile({ name, phone });
      return token;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["walletBalance"] });
      qc.invalidateQueries({ queryKey: ["isAdmin"] });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return () => {
    clearSessionToken();
    qc.invalidateQueries();
  };
}

export function useAddMoney() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error("Not connected");
      const token = getSessionToken();
      if (!token) throw new Error("Not logged in");
      await actor.addMoney(token, amount);
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
      const token = getSessionToken();
      if (!token) throw new Error("Not logged in");
      await actor.placeBet(token, gameId, betType, betNumber, amount);
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
      const token = getSessionToken();
      if (!token) throw new Error("Not logged in");
      return await actor.requestWithdrawal(token, amount, method, details);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["walletBalance"] });
      qc.invalidateQueries({ queryKey: ["userTransactions"] });
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
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
      result,
    }: {
      gameId: string;
      result: GameResult;
    }) => {
      if (!actor) throw new Error("Not connected");
      // Use addGameResult since updateGameResult doesn't exist in new backend
      await actor.addGameResult(result);
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
      qc.invalidateQueries({ queryKey: ["allWithdrawals"] });
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
      qc.invalidateQueries({ queryKey: ["allWithdrawals"] });
    },
  });
}

export function useSettleBets() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (betId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.settleBet(betId, true);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bets"] });
    },
  });
}

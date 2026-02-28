import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Game {
    id: string;
    closeTime: bigint;
    name: string;
    session: string;
    openTime: bigint;
}
export interface Bet {
    id: bigint;
    status: BetStatus;
    userId: Principal;
    createdAt: bigint;
    betType: string;
    gameId: string;
    updatedAt: bigint;
    amount: bigint;
    betNumber: string;
}
export interface Withdrawal {
    id: bigint;
    status: WithdrawalStatus;
    method: {
        __kind__: "upi";
        upi: string;
    } | {
        __kind__: "bank";
        bank: [string, string, string];
    };
    userId: Principal;
    timestamp: bigint;
    details: string;
    amount: bigint;
}
export interface GameResult {
    panelClose: string;
    gameId: string;
    jodiNumber: string;
    closeNumber: string;
    panelOpen: string;
    openNumber: string;
}
export interface UserProfile {
    name: string;
    createdAt: bigint;
    updatedAt: bigint;
    phone: string;
    walletBalance: bigint;
}
export interface Transaction {
    userId: Principal;
    description: string;
    timestamp: bigint;
    txType: string;
    amount: bigint;
}
export enum BetStatus {
    won = "won",
    pending = "pending",
    lost = "lost"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum WithdrawalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    addGame(game: Game): Promise<void>;
    addGameResult(result: GameResult): Promise<void>;
    addMoney(token: string, amount: bigint): Promise<void>;
    approveWithdrawal(withdrawalId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteGame(id: string): Promise<void>;
    getAllBets(): Promise<Array<Bet>>;
    getAllTransactions(): Promise<Array<[Principal, Array<Transaction>]>>;
    getAllWithdrawals(): Promise<Array<Withdrawal>>;
    getBets(token: string): Promise<Array<Bet>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGame(id: string): Promise<Game | null>;
    getGameResult(gameId: string): Promise<GameResult | null>;
    getGames(): Promise<Array<Game>>;
    getTransactions(token: string): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWalletBalance(token: string): Promise<bigint>;
    getWithdrawals(token: string): Promise<Array<Withdrawal>>;
    isAdminCheck(token: string): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    login(phone: string, password: string): Promise<string>;
    placeBet(token: string, gameId: string, betType: string, betNumber: string, amount: bigint): Promise<void>;
    register(name: string, phone: string, password: string): Promise<string>;
    rejectWithdrawal(withdrawalId: bigint): Promise<void>;
    requestWithdrawal(token: string, amount: bigint, method: {
        __kind__: "upi";
        upi: string;
    } | {
        __kind__: "bank";
        bank: [string, string, string];
    }, details: string): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    settleBet(betId: bigint, won: boolean): Promise<void>;
    updateGame(game: Game): Promise<void>;
}

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
    betType: string;
    gameId: string;
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
    password: string;
    name: string;
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
    addMoney(amount: bigint): Promise<void>;
    approveWithdrawal(withdrawalId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getAllUsers(): Promise<Array<Principal>>;
    getBet(id: bigint): Promise<Bet | null>;
    getBets(): Promise<Array<Bet>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGame(id: string): Promise<Game | null>;
    getGameResult(id: string): Promise<GameResult | null>;
    getGames(): Promise<Array<Game>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserTransactions(): Promise<Array<Transaction>>;
    getWalletBalance(): Promise<bigint>;
    getWithdrawals(): Promise<Array<Withdrawal>>;
    isCallerAdmin(): Promise<boolean>;
    placeBet(game: string, betType: string, betNumber: string, amount: bigint): Promise<void>;
    register(name: string, phone: string, password: string): Promise<void>;
    rejectWithdrawal(withdrawalId: bigint): Promise<void>;
    requestWithdrawal(amount: bigint, method: {
        __kind__: "upi";
        upi: string;
    } | {
        __kind__: "bank";
        bank: [string, string, string];
    }, details: string): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    settleBets(gameId: string): Promise<void>;
    updateGameResult(gameId: string, updatedResult: GameResult): Promise<void>;
}

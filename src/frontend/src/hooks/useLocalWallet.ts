import { useCallback, useState } from "react";

const BALANCE_KEY = "matka_wallet_balance";
const WITHDRAWALS_KEY = "matka_withdrawals";
const TRANSACTIONS_KEY = "matka_transactions";
const INITIAL_BALANCE = 10000;

export const INR_TO_USD = 84;

export function inrToUsd(inr: number): number {
  return Math.round((inr / INR_TO_USD) * 100) / 100;
}

export interface LocalWithdrawal {
  id: number;
  amount: number;
  usdAmount?: number;
  method: string; // "UPI: xxx", "Bank: xxx", or "Stripe: xxx"
  details: string;
  status: "approved";
  timestamp: number;
}

export interface LocalTransaction {
  id: number;
  type: "credit" | "debit";
  amount: number;
  description: string;
  timestamp: number;
}

function getBalance(): number {
  const raw = localStorage.getItem(BALANCE_KEY);
  if (raw === null) {
    localStorage.setItem(BALANCE_KEY, String(INITIAL_BALANCE));
    return INITIAL_BALANCE;
  }
  const val = Number(raw);
  return Number.isNaN(val) ? INITIAL_BALANCE : val;
}

function setBalance(amount: number): void {
  localStorage.setItem(BALANCE_KEY, String(amount));
}

function getWithdrawals(): LocalWithdrawal[] {
  try {
    const raw = localStorage.getItem(WITHDRAWALS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalWithdrawal[];
  } catch {
    return [];
  }
}

function getTransactions(): LocalTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalTransaction[];
  } catch {
    return [];
  }
}

function saveWithdrawals(wds: LocalWithdrawal[]): void {
  localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(wds));
}

function saveTransactions(txs: LocalTransaction[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
}

export function useLocalWallet() {
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  const balance = getBalance();
  const withdrawals = getWithdrawals();
  const transactions = getTransactions();

  const withdraw = useCallback(
    (amount: number, method: string, details: string) => {
      const current = getBalance();
      if (amount > current) {
        throw new Error("Insufficient balance");
      }
      const newBalance = current - amount;
      setBalance(newBalance);

      const wds = getWithdrawals();
      const newWd: LocalWithdrawal = {
        id: Date.now(),
        amount,
        usdAmount: inrToUsd(amount),
        method,
        details,
        status: "approved",
        timestamp: Date.now(),
      };
      saveWithdrawals([newWd, ...wds]);

      const txs = getTransactions();
      const newTx: LocalTransaction = {
        id: Date.now() + 1,
        type: "debit",
        amount,
        description: `Withdrawal - ${method}`,
        timestamp: Date.now(),
      };
      saveTransactions([newTx, ...txs]);

      setTick((t) => t + 1);
    },
    [],
  );

  const addMoney = useCallback((amount: number) => {
    const current = getBalance();
    setBalance(current + amount);

    const txs = getTransactions();
    const newTx: LocalTransaction = {
      id: Date.now(),
      type: "credit",
      amount,
      description: "Money Added",
      timestamp: Date.now(),
    };
    saveTransactions([newTx, ...txs]);

    setTick((t) => t + 1);
  }, []);

  // Suppress unused tick warning - it's used to force re-render
  void tick;

  return {
    balance,
    withdraw,
    addMoney,
    transactions,
    withdrawals,
    refetch,
  };
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Loader2,
  RefreshCw,
  Smartphone,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Transaction } from "../backend.d";
import {
  useAddMoney,
  useGetUserProfile,
  useGetUserTransactions,
  useGetWalletBalance,
  useRequestWithdrawal,
} from "../hooks/useQueries";

function formatDate(ts: bigint): string {
  const d = new Date(Number(ts) / 1_000_000); // nanoseconds
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isCredit =
    tx.txType === "credit" || tx.txType === "win" || tx.txType === "deposit";
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/30">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          isCredit
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-destructive/15 text-destructive"
        }`}
      >
        {isCredit ? (
          <ArrowDownLeft className="w-4 h-4" />
        ) : (
          <ArrowUpRight className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body font-medium text-foreground truncate">
          {tx.description || tx.txType}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(tx.timestamp)}
        </p>
      </div>
      <span
        className={`font-display font-bold text-base shrink-0 ${isCredit ? "text-emerald-400" : "text-destructive"}`}
      >
        {isCredit ? "+" : "-"}₹{Number(tx.amount).toLocaleString("en-IN")}
      </span>
    </div>
  );
}

export function WalletPage() {
  const {
    data: walletBalance = 0n,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useGetWalletBalance();
  const { data: transactions = [], isLoading: txLoading } =
    useGetUserTransactions();
  const { data: profile } = useGetUserProfile();
  const addMoneyMutation = useAddMoney();
  const requestWithdrawalMutation = useRequestWithdrawal();

  const [addAmount, setAddAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accHolder, setAccHolder] = useState("");

  const balance = Number(walletBalance);

  async function handleAddMoney() {
    if (!profile) {
      toast.error("Please login first");
      return;
    }
    const amt = Number.parseInt(addAmount);
    if (!amt || amt < 100) {
      toast.error("Minimum add amount is ₹100");
      return;
    }
    try {
      await addMoneyMutation.mutateAsync(BigInt(amt));
      toast.success(`₹${amt} added to wallet`);
      setAddAmount("");
      refetchBalance();
    } catch {
      toast.error("Failed to add money");
    }
  }

  async function handleWithdrawUpi() {
    if (!profile) {
      toast.error("Please login first");
      return;
    }
    const amt = Number.parseInt(withdrawAmount);
    if (!amt || amt < 100) {
      toast.error("Minimum withdrawal is ₹100");
      return;
    }
    if (!upiId.includes("@")) {
      toast.error("Please enter a valid UPI ID (e.g. name@upi)");
      return;
    }
    if (amt > balance) {
      toast.error("Insufficient balance");
      return;
    }
    try {
      await requestWithdrawalMutation.mutateAsync({
        amount: BigInt(amt),
        method: { __kind__: "upi", upi: upiId },
        details: `Withdrawal to UPI: ${upiId}`,
      });
      toast.success("Withdrawal request submitted!");
      setWithdrawAmount("");
      setUpiId("");
    } catch {
      toast.error("Withdrawal request failed");
    }
  }

  async function handleWithdrawBank() {
    if (!profile) {
      toast.error("Please login first");
      return;
    }
    const amt = Number.parseInt(withdrawAmount);
    if (!amt || amt < 100) {
      toast.error("Minimum withdrawal is ₹100");
      return;
    }
    if (!accNumber || !ifscCode || !accHolder) {
      toast.error("Please fill all bank details");
      return;
    }
    if (amt > balance) {
      toast.error("Insufficient balance");
      return;
    }
    try {
      await requestWithdrawalMutation.mutateAsync({
        amount: BigInt(amt),
        method: { __kind__: "bank", bank: [accNumber, ifscCode, accHolder] },
        details: `Withdrawal to Bank: ${accNumber}`,
      });
      toast.success("Withdrawal request submitted! Processing in 24-48 hours.");
      setWithdrawAmount("");
      setAccNumber("");
      setIfscCode("");
      setAccHolder("");
    } catch {
      toast.error("Withdrawal request failed");
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-fire" />
            <h1 className="font-display font-black text-xl">Wallet</h1>
          </div>
          <button
            type="button"
            onClick={() => refetchBalance()}
            className="p-2 rounded-lg hover:bg-secondary/60 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-4 mt-4 rounded-2xl p-6 text-center"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.17 0.06 42) 0%, oklch(0.12 0.03 42) 50%, oklch(0.14 0.04 280) 100%)",
          border: "1px solid oklch(0.35 0.1 42 / 0.5)",
          boxShadow: "0 8px 32px oklch(0.72 0.25 42 / 0.2)",
        }}
      >
        <p className="text-xs text-amber-300/60 uppercase tracking-widest font-body mb-1">
          Available Balance
        </p>
        {balanceLoading ? (
          <Skeleton className="h-12 w-40 mx-auto bg-muted/30" />
        ) : (
          <p className="text-5xl font-display font-black text-gold number-glow">
            ₹{balance.toLocaleString("en-IN")}
          </p>
        )}
        <p className="text-xs text-amber-200/40 mt-2 font-body">
          {profile ? `@${profile.phone}` : "Login to view balance"}
        </p>
      </motion.div>

      {/* Add money + Withdraw */}
      <div className="px-4 mt-6">
        <Tabs defaultValue="add">
          <TabsList
            className="grid grid-cols-2 w-full"
            style={{
              background: "oklch(0.14 0.005 260)",
              border: "1px solid oklch(0.25 0.01 260)",
            }}
          >
            <TabsTrigger
              value="add"
              className="font-bold data-[state=active]:bg-fire data-[state=active]:text-primary-foreground"
            >
              Add Money
            </TabsTrigger>
            <TabsTrigger
              value="withdraw"
              className="font-bold data-[state=active]:bg-fire data-[state=active]:text-primary-foreground"
            >
              Withdraw
            </TabsTrigger>
          </TabsList>

          {/* Add money */}
          <TabsContent value="add" className="mt-4 space-y-4">
            <div
              className="p-4 rounded-xl"
              style={{
                background: "oklch(0.13 0.005 260)",
                border: "1px solid oklch(0.25 0.01 260)",
              }}
            >
              <Label className="text-sm text-muted-foreground font-body">
                Amount (₹)
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                className="mt-2 h-12 text-xl font-bold text-center bg-secondary/60 border-border/40"
                placeholder="Enter amount"
                value={addAmount}
                onChange={(e) =>
                  setAddAmount(e.target.value.replace(/\D/g, ""))
                }
              />
              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setAddAmount(String(amt))}
                    className={`py-2 rounded text-xs font-bold transition-all border ${
                      addAmount === String(amt)
                        ? "bg-fire text-primary-foreground border-fire/50"
                        : "bg-secondary/40 text-muted-foreground border-border/40 hover:border-border"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
              <Button
                className="w-full mt-4 h-12 font-display font-black bg-fire hover:bg-fire/90 text-primary-foreground glow-fire"
                onClick={handleAddMoney}
                disabled={addMoneyMutation.isPending}
              >
                {addMoneyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Processing...
                  </>
                ) : (
                  "Add Money"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2 font-body">
                Min ₹100 · Instant credit · UPI / Net Banking
              </p>
            </div>
          </TabsContent>

          {/* Withdraw */}
          <TabsContent value="withdraw" className="mt-4">
            <Tabs defaultValue="upi">
              <TabsList
                className="grid grid-cols-2 w-full mb-4"
                style={{
                  background: "oklch(0.14 0.005 260)",
                  border: "1px solid oklch(0.25 0.01 260)",
                }}
              >
                <TabsTrigger
                  value="upi"
                  className="font-bold gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground"
                >
                  <Smartphone className="w-4 h-4" /> UPI
                </TabsTrigger>
                <TabsTrigger
                  value="bank"
                  className="font-bold gap-2 data-[state=active]:bg-secondary data-[state=active]:text-foreground"
                >
                  <CreditCard className="w-4 h-4" /> Bank
                </TabsTrigger>
              </TabsList>

              {/* UPI withdraw */}
              <TabsContent value="upi">
                <div
                  className="p-4 rounded-xl space-y-4"
                  style={{
                    background: "oklch(0.13 0.005 260)",
                    border: "1px solid oklch(0.25 0.01 260)",
                  }}
                >
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground font-body">
                      UPI ID
                    </Label>
                    <Input
                      className="bg-secondary/60 border-border/40 h-11"
                      placeholder="name@upi or 9876543210@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground font-body">
                      Withdrawal Amount (₹)
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      className="bg-secondary/60 border-border/40 h-11 font-bold text-lg text-center"
                      placeholder="Min ₹100"
                      value={withdrawAmount}
                      onChange={(e) =>
                        setWithdrawAmount(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </div>
                  <Button
                    className="w-full h-12 font-display font-black bg-emerald-600 hover:bg-emerald-500 text-white glow-green"
                    onClick={handleWithdrawUpi}
                    disabled={requestWithdrawalMutation.isPending}
                  >
                    {requestWithdrawalMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Processing...
                      </>
                    ) : (
                      "Withdraw to UPI"
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* Bank withdraw */}
              <TabsContent value="bank">
                <div
                  className="p-4 rounded-xl space-y-3"
                  style={{
                    background: "oklch(0.13 0.005 260)",
                    border: "1px solid oklch(0.25 0.01 260)",
                  }}
                >
                  {[
                    {
                      label: "Account Holder Name",
                      placeholder: "Full name as on bank",
                      value: accHolder,
                      setter: setAccHolder,
                    },
                    {
                      label: "Account Number",
                      placeholder: "Bank account number",
                      value: accNumber,
                      setter: setAccNumber,
                    },
                    {
                      label: "IFSC Code",
                      placeholder: "e.g. SBIN0001234",
                      value: ifscCode,
                      setter: setIfscCode,
                    },
                  ].map(({ label, placeholder, value, setter }) => (
                    <div key={label} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-body">
                        {label}
                      </Label>
                      <Input
                        className="bg-secondary/60 border-border/40 h-11"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                      />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground font-body">
                      Amount (₹)
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      className="bg-secondary/60 border-border/40 h-11 font-bold text-lg text-center"
                      placeholder="Min ₹100"
                      value={withdrawAmount}
                      onChange={(e) =>
                        setWithdrawAmount(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </div>
                  <Button
                    className="w-full h-12 font-display font-black bg-emerald-600 hover:bg-emerald-500 text-white glow-green"
                    onClick={handleWithdrawBank}
                    disabled={requestWithdrawalMutation.isPending}
                  >
                    {requestWithdrawalMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Submitting...
                      </>
                    ) : (
                      "Withdraw to Bank"
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground font-body">
                    Processing: 24-48 hours
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* Transactions */}
      <div className="px-4 mt-6">
        <h2 className="font-display font-bold text-base mb-3">
          Recent Transactions
        </h2>
        {txLoading ? (
          <>
            {["s1", "s2", "s3", "s4"].map((k) => (
              <div
                key={k}
                className="flex items-center gap-3 py-3 border-b border-border/30"
              >
                <Skeleton className="w-9 h-9 rounded-full bg-muted/30" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40 bg-muted/30" />
                  <Skeleton className="h-3 w-24 bg-muted/30" />
                </div>
                <Skeleton className="h-5 w-16 bg-muted/30" />
              </div>
            ))}
          </>
        ) : transactions.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{
              background: "oklch(0.13 0.005 260)",
              border: "1px solid oklch(0.25 0.01 260)",
            }}
          >
            <p className="text-2xl mb-2">💳</p>
            <p className="text-sm text-muted-foreground font-body">
              No transactions yet
            </p>
          </div>
        ) : (
          <div>
            {transactions.map((tx, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: transactions have no stable id
              <TransactionRow key={i} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

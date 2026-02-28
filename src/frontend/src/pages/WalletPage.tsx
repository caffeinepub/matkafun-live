import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  CreditCard,
  RefreshCw,
  Smartphone,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  LocalTransaction,
  LocalWithdrawal,
} from "../hooks/useLocalWallet";
import { useLocalWallet } from "../hooks/useLocalWallet";

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TransactionRow({ tx }: { tx: LocalTransaction }) {
  const isCredit = tx.type === "credit";
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
          {tx.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(tx.timestamp)}
        </p>
      </div>
      <span
        className={`font-display font-bold text-base shrink-0 ${isCredit ? "text-emerald-400" : "text-destructive"}`}
      >
        {isCredit ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
      </span>
    </div>
  );
}

function WithdrawalRow({ wd }: { wd: LocalWithdrawal }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/30">
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/15 text-emerald-400">
        <CheckCircle className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body font-medium text-foreground truncate">
          {wd.method}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(wd.timestamp)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="font-display font-bold text-base text-destructive shrink-0">
          -₹{wd.amount.toLocaleString("en-IN")}
        </span>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-[10px] px-1.5 py-0">
          APPROVED
        </Badge>
      </div>
    </div>
  );
}

export function WalletPage() {
  const { balance, withdraw, addMoney, transactions, withdrawals, refetch } =
    useLocalWallet();

  const [addAmount, setAddAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accHolder, setAccHolder] = useState("");

  function handleAddMoney() {
    const amt = Number.parseInt(addAmount);
    if (!amt || amt < 100) {
      toast.error("Minimum add amount is ₹100");
      return;
    }
    addMoney(amt);
    toast.success(`₹${amt.toLocaleString("en-IN")} added to wallet!`);
    setAddAmount("");
  }

  function handleWithdrawUpi() {
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
      withdraw(amt, `UPI: ${upiId}`, `Withdrawal to UPI: ${upiId}`);
      toast.success("✅ Withdrawal Approved! Amount sent to your UPI.");
      setWithdrawAmount("");
      setUpiId("");
    } catch (e) {
      toast.error((e as Error).message || "Withdrawal failed");
    }
  }

  function handleWithdrawBank() {
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
      withdraw(
        amt,
        `Bank: ${accNumber}`,
        `Withdrawal to Bank: ${accNumber} | IFSC: ${ifscCode}`,
      );
      toast.success(
        "✅ Withdrawal Approved! Amount sent to your bank account.",
      );
      setWithdrawAmount("");
      setAccNumber("");
      setIfscCode("");
      setAccHolder("");
    } catch (e) {
      toast.error((e as Error).message || "Withdrawal failed");
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
            onClick={refetch}
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
        <p className="text-5xl font-display font-black text-gold number-glow">
          ₹{balance.toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-amber-200/40 mt-2 font-body">
          Instant withdrawal available
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
              >
                Add Money
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2 font-body">
                Min ₹100 · Instant credit
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
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-400 font-body">
                      Withdrawal approved instantly — no waiting!
                    </p>
                  </div>
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
                    className="w-full h-12 font-display font-black bg-emerald-600 hover:bg-emerald-500 text-white"
                    onClick={handleWithdrawUpi}
                  >
                    Withdraw to UPI
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
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-400 font-body">
                      Withdrawal approved instantly — no waiting!
                    </p>
                  </div>
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
                    className="w-full h-12 font-display font-black bg-emerald-600 hover:bg-emerald-500 text-white"
                    onClick={handleWithdrawBank}
                  >
                    Withdraw to Bank
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="font-display font-bold text-base mb-3">
            Withdrawal History
          </h2>
          <div>
            {withdrawals.map((wd) => (
              <WithdrawalRow key={wd.id} wd={wd} />
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="px-4 mt-6">
        <h2 className="font-display font-bold text-base mb-3">
          Recent Transactions
        </h2>
        {transactions.length === 0 ? (
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
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

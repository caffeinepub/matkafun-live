import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CheckCircle,
  CreditCard,
  Lock,
  RefreshCw,
  Shield,
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
import { INR_TO_USD, inrToUsd, useLocalWallet } from "../hooks/useLocalWallet";

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

function TransactionRow({ tx }: { tx: LocalTransaction }) {
  const isCredit = tx.type === "credit";
  const usd = inrToUsd(tx.amount);
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
      <div className="flex flex-col items-end shrink-0">
        <span
          className={`font-display font-bold text-base ${isCredit ? "text-emerald-400" : "text-destructive"}`}
        >
          {isCredit ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
        </span>
        <span className="text-[11px] text-amber-300/50 font-body">
          ${usd.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function WithdrawalRow({ wd }: { wd: LocalWithdrawal }) {
  const isStripe = wd.method.startsWith("Stripe:");
  const usd = wd.usdAmount ?? inrToUsd(wd.amount);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/30">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          isStripe
            ? "bg-indigo-500/15 text-indigo-400"
            : "bg-emerald-500/15 text-emerald-400"
        }`}
      >
        {isStripe ? (
          <CreditCard className="w-4 h-4" />
        ) : (
          <CheckCircle className="w-4 h-4" />
        )}
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
        <span className="text-[11px] text-amber-300/50 font-body">
          (${usd.toFixed(2)})
        </span>
        {isStripe ? (
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 border text-[10px] px-1.5 py-0">
            STRIPE
          </Badge>
        ) : (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-[10px] px-1.5 py-0">
            APPROVED
          </Badge>
        )}
        {isStripe && (
          <span className="text-[10px] text-indigo-400/70 font-body">
            Processing (2-5 days)
          </span>
        )}
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

  // Stripe fields
  const [stripeCardNumber, setStripeCardNumber] = useState("");
  const [stripeCardHolder, setStripeCardHolder] = useState("");
  const [stripeExpiry, setStripeExpiry] = useState("");
  const [stripeCvv, setStripeCvv] = useState("");
  const [stripeAmount, setStripeAmount] = useState("");

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

  function handleWithdrawStripe() {
    const amt = Number.parseInt(stripeAmount);
    if (!amt || amt < 100) {
      toast.error("Minimum withdrawal is ₹100");
      return;
    }
    const rawCard = stripeCardNumber.replace(/\s/g, "");
    if (rawCard.length < 16) {
      toast.error("Please enter a valid 16-digit card number");
      return;
    }
    if (!stripeCardHolder.trim()) {
      toast.error("Please enter the cardholder name");
      return;
    }
    if (stripeExpiry.length < 5) {
      toast.error("Please enter a valid expiry date (MM/YY)");
      return;
    }
    if (stripeCvv.length < 3) {
      toast.error("Please enter a valid CVV");
      return;
    }
    if (amt > balance) {
      toast.error("Insufficient balance");
      return;
    }
    const last4 = rawCard.slice(-4);
    const usd = inrToUsd(amt);
    try {
      withdraw(
        amt,
        `Stripe: ****${last4}`,
        `Stripe card payout to **** **** **** ${last4}`,
      );
      toast.success(
        `✅ Stripe Withdrawal Initiated! ₹${amt.toLocaleString("en-IN")} ($${usd.toFixed(2)} USD) will be processed within 2-5 business days.`,
        { duration: 5000 },
      );
      setStripeAmount("");
      setStripeCardNumber("");
      setStripeCardHolder("");
      setStripeExpiry("");
      setStripeCvv("");
    } catch (e) {
      toast.error((e as Error).message || "Withdrawal failed");
    }
  }

  const balanceUsd = inrToUsd(balance);
  const addAmountNum = Number.parseInt(addAmount) || 0;
  const stripeAmountNum = Number.parseInt(stripeAmount) || 0;

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
        <p className="text-sm text-amber-300/70 mt-1.5 font-body font-semibold">
          ≈ ${balanceUsd.toFixed(2)} USD
        </p>
        <p className="text-[11px] text-amber-200/35 mt-1 font-body">
          1 USD = ₹{INR_TO_USD} (fixed rate) · Instant withdrawal available
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
              {addAmountNum > 0 && (
                <p className="text-xs text-amber-300/60 text-center mt-1.5 font-body">
                  = ${inrToUsd(addAmountNum).toFixed(2)} USD
                </p>
              )}
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
                className="grid grid-cols-3 w-full mb-4"
                style={{
                  background: "oklch(0.14 0.005 260)",
                  border: "1px solid oklch(0.25 0.01 260)",
                }}
              >
                <TabsTrigger
                  value="upi"
                  className="font-bold gap-1.5 data-[state=active]:bg-secondary data-[state=active]:text-foreground text-xs"
                >
                  <Smartphone className="w-3.5 h-3.5" /> UPI
                </TabsTrigger>
                <TabsTrigger
                  value="bank"
                  className="font-bold gap-1.5 data-[state=active]:bg-secondary data-[state=active]:text-foreground text-xs"
                >
                  <Building2 className="w-3.5 h-3.5" /> Bank
                </TabsTrigger>
                <TabsTrigger
                  value="stripe"
                  className="font-bold gap-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Stripe
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
                    {Number.parseInt(withdrawAmount) > 0 && (
                      <p className="text-xs text-amber-300/60 text-center font-body">
                        = $
                        {inrToUsd(Number.parseInt(withdrawAmount)).toFixed(2)}{" "}
                        USD
                      </p>
                    )}
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
                    {Number.parseInt(withdrawAmount) > 0 && (
                      <p className="text-xs text-amber-300/60 text-center font-body">
                        = $
                        {inrToUsd(Number.parseInt(withdrawAmount)).toFixed(2)}{" "}
                        USD
                      </p>
                    )}
                  </div>
                  <Button
                    className="w-full h-12 font-display font-black bg-emerald-600 hover:bg-emerald-500 text-white"
                    onClick={handleWithdrawBank}
                  >
                    Withdraw to Bank
                  </Button>
                </div>
              </TabsContent>

              {/* Stripe withdraw */}
              <TabsContent value="stripe">
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    border: "1px solid oklch(0.35 0.12 270 / 0.5)",
                    boxShadow: "0 4px 24px oklch(0.5 0.2 270 / 0.15)",
                  }}
                >
                  {/* Stripe header */}
                  <div
                    className="px-4 py-3 flex items-center gap-3"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.22 0.09 270) 0%, oklch(0.18 0.07 260) 100%)",
                      borderBottom: "1px solid oklch(0.35 0.12 270 / 0.4)",
                    }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/25 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div>
                      <p className="text-sm font-display font-black text-indigo-200">
                        Stripe Secure Payout
                      </p>
                      <p className="text-[11px] text-indigo-400/70 font-body flex items-center gap-1">
                        <Shield className="w-3 h-3" /> 256-bit SSL Encrypted
                      </p>
                    </div>
                  </div>

                  <div
                    className="p-4 space-y-3"
                    style={{ background: "oklch(0.13 0.005 260)" }}
                  >
                    {/* Card Number */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-indigo-300/80 font-body">
                        Card Number
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="numeric"
                          className="bg-secondary/60 border-indigo-500/30 h-11 font-mono text-base tracking-wider pr-10 focus:border-indigo-500/60"
                          placeholder="1234 5678 9012 3456"
                          value={stripeCardNumber}
                          maxLength={19}
                          onChange={(e) =>
                            setStripeCardNumber(
                              formatCardNumber(e.target.value),
                            )
                          }
                        />
                        <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400/50" />
                      </div>
                    </div>

                    {/* Cardholder Name */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-indigo-300/80 font-body">
                        Cardholder Name
                      </Label>
                      <Input
                        type="text"
                        className="bg-secondary/60 border-indigo-500/30 h-11 focus:border-indigo-500/60"
                        placeholder="Name on card"
                        value={stripeCardHolder}
                        onChange={(e) =>
                          setStripeCardHolder(e.target.value.toUpperCase())
                        }
                      />
                    </div>

                    {/* Expiry + CVV */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-indigo-300/80 font-body">
                          Expiry Date
                        </Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          className="bg-secondary/60 border-indigo-500/30 h-11 font-mono tracking-widest focus:border-indigo-500/60"
                          placeholder="MM/YY"
                          value={stripeExpiry}
                          maxLength={5}
                          onChange={(e) =>
                            setStripeExpiry(formatExpiry(e.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-indigo-300/80 font-body">
                          CVV
                        </Label>
                        <Input
                          type="password"
                          inputMode="numeric"
                          className="bg-secondary/60 border-indigo-500/30 h-11 font-mono tracking-widest focus:border-indigo-500/60"
                          placeholder="•••"
                          value={stripeCvv}
                          maxLength={4}
                          onChange={(e) =>
                            setStripeCvv(e.target.value.replace(/\D/g, ""))
                          }
                        />
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-indigo-300/80 font-body">
                        Withdrawal Amount (₹)
                      </Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        className="bg-secondary/60 border-indigo-500/30 h-11 font-bold text-lg text-center focus:border-indigo-500/60"
                        placeholder="Min ₹100"
                        value={stripeAmount}
                        onChange={(e) =>
                          setStripeAmount(e.target.value.replace(/\D/g, ""))
                        }
                      />
                      {stripeAmountNum > 0 && (
                        <p className="text-xs text-indigo-300/60 text-center font-body">
                          = ${inrToUsd(stripeAmountNum).toFixed(2)} USD
                        </p>
                      )}
                    </div>

                    {/* Info box */}
                    <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-start gap-2">
                      <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-indigo-300/80 font-body leading-relaxed">
                        Stripe processes your payout securely. Amount will be
                        credited to your card within{" "}
                        <span className="text-indigo-300 font-semibold">
                          2-5 business days
                        </span>
                        .
                      </p>
                    </div>

                    {/* Stripe button */}
                    <Button
                      className="w-full h-12 font-display font-black text-white transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{
                        background:
                          "linear-gradient(135deg, #635BFF 0%, #4F46E5 100%)",
                        boxShadow: "0 4px 16px rgba(99,91,255,0.35)",
                      }}
                      onClick={handleWithdrawStripe}
                    >
                      {stripeAmountNum > 0
                        ? `Withdraw ₹${stripeAmountNum.toLocaleString("en-IN")} ($${inrToUsd(stripeAmountNum).toFixed(2)})`
                        : "Withdraw via Stripe"}
                    </Button>
                  </div>
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Loader2,
  Lock,
  LogOut,
  Phone,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  clearSessionToken,
  getSessionToken,
  useGetUserProfile,
  useGetWalletBalance,
  useIsAdmin,
  useLogin,
  useLogout,
  useRegister,
} from "../hooks/useQueries";

export function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const token = getSessionToken();
  const isLoggedIn = !!token;

  const { data: profile, refetch: refetchProfile } = useGetUserProfile();
  const { data: walletBalance = 0n, refetch: refetchBalance } =
    useGetWalletBalance();
  const { data: isAdmin } = useIsAdmin();

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logout = useLogout();

  // Login form
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginPhone.match(/^\d{10}$/)) {
      toast.error("10-digit phone number daalen");
      return;
    }
    if (loginPassword.length < 6) {
      toast.error("Password kam se kam 6 characters ka hona chahiye");
      return;
    }
    try {
      await loginMutation.mutateAsync({
        phone: loginPhone,
        password: loginPassword,
      });
      await Promise.all([refetchProfile(), refetchBalance()]);
      toast.success("Login successful! Swagat hai 🎉");
      setLoginPhone("");
      setLoginPassword("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (
        msg.includes("Invalid") ||
        msg.includes("invalid") ||
        msg.includes("not found")
      ) {
        toast.error("Phone ya password galat hai");
      } else {
        toast.error("Login failed. Dobara try karein.");
      }
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim()) {
      toast.error("Apna naam daalen");
      return;
    }
    if (!regPhone.match(/^\d{10}$/)) {
      toast.error("Valid 10-digit phone number daalen");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("Password kam se kam 6 characters ka hona chahiye");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error("Dono passwords match nahin kar rahe");
      return;
    }
    try {
      await registerMutation.mutateAsync({
        name: regName,
        phone: regPhone,
        password: regPassword,
      });
      await Promise.all([refetchProfile(), refetchBalance()]);
      toast.success(
        "🎉 Account ban gaya! ₹1,000 welcome bonus credit ho gaya!",
      );
      setRegName("");
      setRegPhone("");
      setRegPassword("");
      setRegConfirmPassword("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (
        msg.includes("already") ||
        msg.includes("exists") ||
        msg.includes("registered")
      ) {
        toast.error("Yeh phone number pehle se registered hai. Login karein.");
      } else {
        toast.error("Registration failed. Dobara try karein.");
      }
    }
  }

  function handleLogout() {
    clearSessionToken();
    logout();
    qc.invalidateQueries();
    toast.success("Logout ho gaye");
    navigate({ to: "/" });
  }

  // ── Logged in WITH profile: show dashboard ─────────────────────────────────
  if (isLoggedIn && profile) {
    const displayName = profile.name || profile.phone;
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
            <User className="w-5 h-5 text-fire" />
            <h1 className="font-display font-black text-xl">Profile</h1>
          </div>
        </header>

        {/* Avatar + name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center px-4 pt-8 pb-6"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-display font-black text-fire mb-4"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.17 0.06 42) 0%, oklch(0.12 0.03 42) 100%)",
              border: "2px solid oklch(0.35 0.1 42 / 0.5)",
              boxShadow: "0 0 20px oklch(0.72 0.25 42 / 0.25)",
            }}
          >
            {displayName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <h2 className="font-display font-black text-2xl text-foreground">
            {profile.name || "User"}
          </h2>
          <p className="text-muted-foreground font-body text-sm mt-1">
            +91 {profile.phone}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="mx-4 grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: "oklch(0.13 0.005 260)",
              border: "1px solid oklch(0.25 0.01 260)",
            }}
          >
            <p className="text-2xl font-display font-black text-gold number-glow">
              ₹{Number(walletBalance).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground font-body mt-1 uppercase tracking-wider">
              Balance
            </p>
          </div>
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: "oklch(0.13 0.005 260)",
              border: "1px solid oklch(0.25 0.01 260)",
            }}
          >
            <p className="text-2xl font-display font-black text-fire">VIP</p>
            <p className="text-xs text-muted-foreground font-body mt-1 uppercase tracking-wider">
              Member Level
            </p>
          </div>
        </div>

        {/* Account Details */}
        <div
          className="mx-4 mt-4 p-4 rounded-xl"
          style={{
            background: "oklch(0.13 0.005 260)",
            border: "1px solid oklch(0.25 0.01 260)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-fire" />
            <span className="text-sm font-bold text-foreground font-body">
              Account Details
            </span>
          </div>
          {[
            { icon: User, label: "Naam", value: profile.name || "—" },
            { icon: Phone, label: "Phone", value: `+91 ${profile.phone}` },
            { icon: Lock, label: "Password", value: "••••••••" },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0"
            >
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground w-16 shrink-0 font-body">
                {label}
              </span>
              <span className="text-sm font-body text-foreground truncate">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/wallet" })}
            className="p-4 rounded-xl text-left transition-all hover:border-fire/30"
            style={{
              background: "oklch(0.13 0.005 260)",
              border: "1px solid oklch(0.25 0.01 260)",
            }}
          >
            <p className="text-sm font-bold text-foreground font-body">
              💰 Add Money
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Top up wallet
            </p>
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/history" })}
            className="p-4 rounded-xl text-left transition-all hover:border-fire/30"
            style={{
              background: "oklch(0.13 0.005 260)",
              border: "1px solid oklch(0.25 0.01 260)",
            }}
          >
            <p className="text-sm font-bold text-foreground font-body">
              🎲 Bet History
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              View all bets
            </p>
          </button>
        </div>

        {/* Admin Panel button — only for admins */}
        {isAdmin && (
          <div className="px-4 mt-4">
            <button
              type="button"
              onClick={() => navigate({ to: "/admin" })}
              className="w-full p-4 rounded-xl text-left flex items-center gap-3 transition-all"
              style={{
                background: "oklch(0.13 0.04 160 / 0.3)",
                border: "1px solid oklch(0.35 0.1 160 / 0.4)",
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: "oklch(0.22 0.07 160 / 0.6)",
                }}
              >
                <Settings className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-400 font-body">
                  Admin Panel
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage games, results & withdrawals
                </p>
              </div>
              <Shield className="w-4 h-4 text-emerald-400/60 ml-auto shrink-0" />
            </button>
          </div>
        )}

        {/* Logout */}
        <div className="px-4 mt-4">
          <Button
            variant="outline"
            className="w-full h-12 border-destructive/40 text-destructive hover:bg-destructive/10 font-bold font-body"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    );
  }

  // ── Logged in but NO profile: session token exists but no stored profile  ──
  if (isLoggedIn && !profile) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-fire mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-body">
            Loading profile...
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 text-xs text-muted-foreground hover:text-foreground/70 transition-colors underline"
          >
            Logout karein
          </button>
        </div>
      </div>
    );
  }

  // ── NOT logged in: show login / register tabs ──────────────────────────────
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
          <User className="w-5 h-5 text-fire" />
          <h1 className="font-display font-black text-xl">Account</h1>
        </div>
      </header>

      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center px-4 pt-8 pb-5"
      >
        <div className="text-5xl mb-3">🎯</div>
        <h2 className="font-display font-black text-2xl text-foreground">
          MatkaFun mein Swagat!
        </h2>
        <p className="text-muted-foreground font-body text-sm mt-2 max-w-xs mx-auto">
          Login ya register karein aur live matka games mein participate karein
        </p>
        <div
          className="inline-block mt-3 px-4 py-2 rounded-full text-sm font-bold text-gold"
          style={{
            background: "oklch(0.17 0.06 42 / 0.4)",
            border: "1px solid oklch(0.35 0.1 42 / 0.5)",
          }}
        >
          🎁 Naye Members ko ₹1,000 Welcome Bonus!
        </div>
      </motion.div>

      {/* Tabs: Login / Register */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="px-4"
      >
        <Tabs defaultValue="login" className="w-full">
          <TabsList
            className="grid grid-cols-2 w-full mb-5"
            style={{
              background: "oklch(0.14 0.005 260)",
              border: "1px solid oklch(0.25 0.01 260)",
            }}
          >
            <TabsTrigger
              value="login"
              className="font-bold data-[state=active]:bg-fire data-[state=active]:text-primary-foreground"
            >
              Login
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="font-bold data-[state=active]:bg-fire data-[state=active]:text-primary-foreground"
            >
              New Account
            </TabsTrigger>
          </TabsList>

          {/* ── Login Tab ── */}
          <TabsContent value="login">
            <form
              onSubmit={handleLogin}
              className="p-5 rounded-2xl space-y-4"
              style={{
                background: "oklch(0.13 0.005 260)",
                border: "1px solid oklch(0.25 0.01 260)",
              }}
            >
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground font-body flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone Number
                </Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className="bg-secondary/60 border-border/40 h-12 text-lg font-bold tracking-wider"
                  placeholder="10-digit mobile number"
                  value={loginPhone}
                  onChange={(e) =>
                    setLoginPhone(e.target.value.replace(/\D/g, ""))
                  }
                  autoComplete="tel"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground font-body flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Password
                </Label>
                <Input
                  type="password"
                  className="bg-secondary/60 border-border/40 h-12"
                  placeholder="Apna password daalen"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-display font-black bg-fire hover:bg-fire/90 text-primary-foreground glow-fire"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Login ho raha hai...
                  </>
                ) : (
                  "Login Karein"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* ── Register Tab ── */}
          <TabsContent value="register">
            <form
              onSubmit={handleRegister}
              className="p-5 rounded-2xl space-y-4"
              style={{
                background: "oklch(0.13 0.005 260)",
                border: "1px solid oklch(0.25 0.01 260)",
              }}
            >
              <div
                className="flex items-center gap-2 p-3 rounded-xl"
                style={{
                  background: "oklch(0.17 0.06 42 / 0.2)",
                  border: "1px solid oklch(0.35 0.1 42 / 0.3)",
                }}
              >
                <span className="text-lg">🎁</span>
                <p className="text-xs text-amber-300/80 font-body">
                  Register karke <strong className="text-gold">₹1,000</strong>{" "}
                  welcome bonus instant pao!
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground font-body flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Pura Naam
                </Label>
                <Input
                  type="text"
                  className="bg-secondary/60 border-border/40 h-12"
                  placeholder="Apna naam likhein"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground font-body flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone Number
                </Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className="bg-secondary/60 border-border/40 h-12 text-lg font-bold tracking-wider"
                  placeholder="10-digit mobile number"
                  value={regPhone}
                  onChange={(e) =>
                    setRegPhone(e.target.value.replace(/\D/g, ""))
                  }
                  autoComplete="tel"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground font-body flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Password
                </Label>
                <Input
                  type="password"
                  className="bg-secondary/60 border-border/40 h-12"
                  placeholder="Minimum 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground font-body flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Password Confirm Karein
                </Label>
                <Input
                  type="password"
                  className="bg-secondary/60 border-border/40 h-12"
                  placeholder="Password dobara likhein"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-display font-black bg-fire hover:bg-fire/90 text-primary-foreground glow-fire"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Account ban raha hai...
                  </>
                ) : (
                  "Register & ₹1,000 Pao"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

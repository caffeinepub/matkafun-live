import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  useGoogleLogin,
  useIsAdmin,
  useLogout,
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

  const googleLoginMutation = useGoogleLogin();
  const logout = useLogout();

  // ── Single-box login state ────────────────────────────────────────────────
  const [loginInput, setLoginInput] = useState("");

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleSimpleLogin(e: React.FormEvent) {
    e.preventDefault();
    const val = loginInput.trim().toLowerCase();

    if (val !== "admin" && val !== "user") {
      toast.error("Sirf 'admin' ya 'user' likhein");
      return;
    }

    const isAdminLogin = val === "admin";

    try {
      await googleLoginMutation.mutateAsync({
        email: isAdminLogin ? "admin@matkafun.com" : "user@matkafun.com",
        displayName: isAdminLogin ? "Admin" : "User",
        wantsAdmin: isAdminLogin,
        adminCode: isAdminLogin ? "Wesrock" : "",
      });
      await Promise.all([refetchProfile(), refetchBalance()]);
      setLoginInput("");
      if (isAdminLogin) {
        toast.success("Admin login ho gaya! Welcome 🛡️");
      } else {
        toast.success("Login ho gaya! Swagat hai 🎉");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (
        msg.includes("Invalid admin") ||
        msg.includes("admin code") ||
        msg.toLowerCase().includes("unauthorized")
      ) {
        toast.error("Login failed. Dobara try karein.");
      } else {
        toast.error("Login failed. Dobara try karein.");
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

  // ── Logged in WITH profile: show dashboard ─────────────────────────────
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
            {profile.phone ? `+91 ${profile.phone}` : "Google Account"}
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
            {
              icon: Phone,
              label: "Phone",
              value: profile.phone ? `+91 ${profile.phone}` : "—",
            },
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

  // ── Logged in but NO profile: loading ─────────────────────────────────
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

  // ── NOT logged in: show single-box login ───────────────────────────────
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
        className="text-center px-4 pt-10 pb-6"
      >
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="font-display font-black text-2xl text-foreground">
          MatkaFun mein Swagat!
        </h2>
        <p className="text-muted-foreground font-body text-sm mt-2 max-w-xs mx-auto">
          Neeche box mein <strong className="text-gold">admin</strong> ya{" "}
          <strong className="text-fire">user</strong> likhein aur login karein
        </p>
      </motion.div>

      {/* ── Single Login Box ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="px-4"
      >
        <form
          onSubmit={handleSimpleLogin}
          className="p-6 rounded-2xl space-y-5"
          style={{
            background: "oklch(0.13 0.005 260)",
            border: "1px solid oklch(0.3 0.05 260)",
            boxShadow: "0 4px 32px oklch(0.72 0.25 42 / 0.08)",
          }}
        >
          <div className="space-y-2">
            <Label
              htmlFor="login-input"
              className="text-sm font-bold text-muted-foreground font-body"
            >
              Login karein
            </Label>
            <Input
              id="login-input"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="h-14 text-xl text-center font-display font-black tracking-widest bg-secondary/60 border-border/40"
              style={{
                fontSize: "1.35rem",
                letterSpacing: "0.15em",
              }}
              placeholder="admin  ya  user"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
            />
            <p className="text-xs text-center text-muted-foreground font-body pt-0.5">
              Admin likhein → Admin panel &nbsp;|&nbsp; User likhein → Game
              khelo
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-13 font-display font-black text-base glow-fire"
            style={{
              height: "3.25rem",
              background: "oklch(0.72 0.25 42)",
              color: "oklch(0.08 0 0)",
            }}
            disabled={googleLoginMutation.isPending}
          >
            {googleLoginMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Login ho raha hai...
              </>
            ) : (
              "Login Karein"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

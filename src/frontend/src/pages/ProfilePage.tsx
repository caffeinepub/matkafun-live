import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Phone,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  clearSessionToken,
  getSessionToken,
  useGetUserProfile,
  useGetWalletBalance,
  useGoogleLogin,
  useIsAdmin,
  useLogin,
  useLogout,
  useRegister,
} from "../hooks/useQueries";

// ── Google G SVG Icon ──────────────────────────────────────────────────────────
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Google"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── Role Card Component ────────────────────────────────────────────────────────
function RoleCard({
  emoji,
  title,
  description,
  isSelected,
  onClick,
  color,
}: {
  emoji: string;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  color: "amber" | "emerald";
}) {
  const borderColor =
    color === "amber"
      ? isSelected
        ? "oklch(0.72 0.25 42)"
        : "oklch(0.25 0.01 260)"
      : isSelected
        ? "oklch(0.72 0.18 160)"
        : "oklch(0.25 0.01 260)";

  const bgColor =
    color === "amber"
      ? isSelected
        ? "oklch(0.17 0.06 42 / 0.35)"
        : "oklch(0.13 0.005 260)"
      : isSelected
        ? "oklch(0.14 0.05 160 / 0.35)"
        : "oklch(0.13 0.005 260)";

  const glowColor =
    color === "amber"
      ? isSelected
        ? "0 0 16px oklch(0.72 0.25 42 / 0.25)"
        : "none"
      : isSelected
        ? "0 0 16px oklch(0.72 0.18 160 / 0.25)"
        : "none";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 p-4 rounded-2xl text-left transition-all duration-200 flex flex-col gap-2"
      style={{
        background: bgColor,
        border: `2px solid ${borderColor}`,
        boxShadow: glowColor,
      }}
    >
      <div className="text-3xl">{emoji}</div>
      <div>
        <p
          className="font-display font-black text-base"
          style={{
            color:
              color === "amber"
                ? isSelected
                  ? "oklch(0.82 0.18 42)"
                  : "oklch(0.9 0.01 260)"
                : isSelected
                  ? "oklch(0.82 0.18 160)"
                  : "oklch(0.9 0.01 260)",
          }}
        >
          {title}
        </p>
        <p className="text-xs text-muted-foreground font-body mt-0.5 leading-snug">
          {description}
        </p>
      </div>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 rounded-full flex items-center justify-center ml-auto"
          style={{
            background:
              color === "amber"
                ? "oklch(0.72 0.25 42)"
                : "oklch(0.72 0.18 160)",
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            role="img"
            aria-label="Selected"
          >
            <path
              d="M2 5l2 2 4-4"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      )}
    </button>
  );
}

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
  const googleLoginMutation = useGoogleLogin();
  const logout = useLogout();

  // ── Google login flow state ──────────────────────────────────────────────────
  const [googleEmail, setGoogleEmail] = useState("");
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"user" | "admin" | null>(
    null,
  );
  const [adminCode, setAdminCode] = useState("");

  // ── Phone/password login state ───────────────────────────────────────────────
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // ── Register form state ──────────────────────────────────────────────────────
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleGoogleContinue(e: React.FormEvent) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(googleEmail)) {
      toast.error("Sahi email address daalen (jaise: name@gmail.com)");
      return;
    }
    setSelectedRole(null);
    setAdminCode("");
    setShowRoleDialog(true);
  }

  async function handleGoogleLogin() {
    if (!selectedRole) {
      toast.error("Pehle apna role select karein");
      return;
    }
    if (selectedRole === "admin" && !adminCode.trim()) {
      toast.error("Admin code daalen");
      return;
    }

    const displayName = googleEmail.split("@")[0];
    try {
      await googleLoginMutation.mutateAsync({
        email: googleEmail,
        displayName,
        wantsAdmin: selectedRole === "admin",
        adminCode: selectedRole === "admin" ? adminCode.trim() : "",
      });
      await Promise.all([refetchProfile(), refetchBalance()]);
      setShowRoleDialog(false);
      setGoogleEmail("");
      setAdminCode("");
      setSelectedRole(null);
      if (selectedRole === "admin") {
        toast.success("Admin access mil gaya! Welcome 🛡️");
      } else {
        toast.success("Login ho gaya! Swagat hai 🎉");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (
        msg.includes("Invalid admin") ||
        msg.includes("admin code") ||
        msg.includes("wrong code") ||
        msg.toLowerCase().includes("unauthorized")
      ) {
        toast.error("Admin code galat hai. Dobara try karein.");
      } else if (msg.includes("already") || msg.includes("exists")) {
        toast.error("Yeh email pehle se registered hai. Login ho raha hai...");
        // Try logging in without admin
        try {
          await googleLoginMutation.mutateAsync({
            email: googleEmail,
            displayName,
            wantsAdmin: false,
            adminCode: "",
          });
          await Promise.all([refetchProfile(), refetchBalance()]);
          setShowRoleDialog(false);
          toast.success("Login ho gaya! Swagat hai 🎉");
        } catch {
          toast.error("Login failed. Dobara try karein.");
        }
      } else {
        toast.error("Login failed. Dobara try karein.");
      }
    }
  }

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

  // ── Logged in but NO profile: loading ──────────────────────────────────────
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

  // ── NOT logged in: show Google login + fallback tabs ────────────────────────
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
          Google email se login karein — ek step mein account ban jayega
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

      {/* ── Google Login Section ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="px-4 mb-2"
      >
        <form
          onSubmit={handleGoogleContinue}
          className="p-5 rounded-2xl space-y-4"
          style={{
            background: "oklch(0.13 0.005 260)",
            border: "1px solid oklch(0.3 0.05 260)",
          }}
        >
          {/* Google branding header */}
          <div className="flex items-center gap-3 pb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.98 0 0)" }}
            >
              <GoogleIcon size={22} />
            </div>
            <div>
              <p className="font-display font-black text-base text-foreground leading-tight">
                Google se Login / Register
              </p>
              <p className="text-xs text-muted-foreground font-body">
                Email daalo, account khud ban jayega
              </p>
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground font-body flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Apna Google Email
            </Label>
            <Input
              type="email"
              inputMode="email"
              className="bg-secondary/60 border-border/40 h-12 text-base"
              placeholder="example@gmail.com"
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 font-display font-black flex items-center justify-center gap-2"
            style={{
              background: "oklch(0.98 0 0)",
              color: "oklch(0.2 0 0)",
            }}
            disabled={googleLoginMutation.isPending}
          >
            {googleLoginMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Login ho raha hai...
              </>
            ) : (
              <>
                <GoogleIcon size={18} />
                Aage Badhen
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </motion.div>

      {/* ── Separator ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="px-4 my-4 flex items-center gap-3"
      >
        <div
          className="flex-1 h-px"
          style={{ background: "oklch(0.25 0.01 260)" }}
        />
        <span className="text-xs text-muted-foreground font-body px-1">
          — ya phone se —
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: "oklch(0.25 0.01 260)" }}
        />
      </motion.div>

      {/* ── Fallback: Phone+Password Login / Register Tabs ─────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
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
              Phone Login
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="font-bold data-[state=active]:bg-fire data-[state=active]:text-primary-foreground"
            >
              New Account
            </TabsTrigger>
          </TabsList>

          {/* ── Phone Login Tab ── */}
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

      {/* ── Role Selection Dialog ─────────────────────────────────────────── */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent
          className="max-w-sm mx-auto rounded-2xl p-0 overflow-hidden"
          style={{
            background: "oklch(0.11 0.005 260)",
            border: "1px solid oklch(0.28 0.02 260)",
          }}
        >
          <DialogHeader className="px-5 pt-6 pb-2">
            <DialogTitle className="font-display font-black text-xl text-center text-foreground">
              Aap kaun hain?
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-body text-center mt-1">
              {googleEmail}
            </p>
          </DialogHeader>

          <div className="px-5 pb-5 space-y-4">
            {/* Role Cards */}
            <div className="flex gap-3">
              <RoleCard
                emoji="👤"
                title="User"
                description="Games khelo aur bet lagao"
                isSelected={selectedRole === "user"}
                onClick={() => setSelectedRole("user")}
                color="amber"
              />
              <RoleCard
                emoji="🛡️"
                title="Admin"
                description="Games manage karo"
                isSelected={selectedRole === "admin"}
                onClick={() => setSelectedRole("admin")}
                color="emerald"
              />
            </div>

            {/* Admin Code Field — only when Admin selected */}
            <AnimatePresence>
              {selectedRole === "admin" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-sm font-body flex items-center gap-1.5 text-emerald-400">
                      <Shield className="w-3.5 h-3.5" /> Admin Code
                    </Label>
                    <Input
                      type="password"
                      className="bg-secondary/60 h-12"
                      style={{
                        borderColor: "oklch(0.4 0.1 160 / 0.5)",
                      }}
                      placeholder="Secret admin code daalen"
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground font-body">
                      Hint: MATKA2024
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-12 font-display font-black"
              style={{
                background:
                  selectedRole === "admin"
                    ? "oklch(0.55 0.18 160)"
                    : selectedRole === "user"
                      ? "oklch(0.72 0.25 42)"
                      : "oklch(0.35 0.01 260)",
                color: "oklch(0.98 0 0)",
                opacity: selectedRole ? 1 : 0.6,
              }}
              disabled={googleLoginMutation.isPending || !selectedRole}
            >
              {googleLoginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Login ho raha hai...
                </>
              ) : (
                "Login Karein ✓"
              )}
            </Button>

            <button
              type="button"
              onClick={() => setShowRoleDialog(false)}
              className="w-full text-xs text-muted-foreground font-body text-center hover:text-foreground/70 transition-colors"
            >
              Wapas jaao
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

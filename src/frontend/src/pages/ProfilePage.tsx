import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, LogOut, Phone, Shield, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetUserProfile,
  useGetWalletBalance,
  useRegister,
} from "../hooks/useQueries";

export function ProfilePage() {
  const navigate = useNavigate();
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: profile, refetch: refetchProfile } = useGetUserProfile();
  const { data: walletBalance = 0n, refetch: refetchBalance } =
    useGetWalletBalance();
  const registerMutation = useRegister();

  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const isLoggedIn = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  async function handleLogin() {
    try {
      await login();
      await Promise.all([refetchProfile(), refetchBalance()]);
      toast.success("Logged in successfully!");
    } catch {
      toast.error("Login failed. Please try again.");
    }
  }

  async function handleRegister() {
    if (!regName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!regPhone.match(/^\d{10}$/)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!isLoggedIn) {
      toast.error("Please login with Internet Identity first");
      return;
    }

    try {
      await registerMutation.mutateAsync({
        name: regName,
        phone: regPhone,
        password: regPassword,
      });
      await Promise.all([refetchProfile(), refetchBalance()]);
      toast.success("🎉 Account created! ₹1,000 welcome bonus added!");
    } catch {
      toast.error("Registration failed. Account may already exist.");
    }
  }

  function handleLogout() {
    clear();
    toast.success("Logged out successfully");
  }

  if (isLoggedIn && profile) {
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
            {profile.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <h2 className="font-display font-black text-2xl text-foreground">
            {profile.name}
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

        {/* Identity info */}
        <div
          className="mx-4 mt-4 p-4 rounded-xl"
          style={{
            background: "oklch(0.13 0.005 260)",
            border: "1px solid oklch(0.25 0.01 260)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-foreground font-body">
              Account Details
            </span>
          </div>
          {[
            { icon: User, label: "Name", value: profile.name },
            { icon: Phone, label: "Phone", value: profile.phone },
            {
              icon: Lock,
              label: "Principal",
              value: `${identity?.getPrincipal().toString().slice(0, 20)}...`,
            },
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

        {/* Logout */}
        <div className="px-4 mt-6">
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

  // Not logged in view
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
        className="text-center px-4 pt-8 pb-6"
      >
        <div className="text-5xl mb-3">🎯</div>
        <h2 className="font-display font-black text-2xl text-foreground">
          Welcome to MatkaFun
        </h2>
        <p className="text-muted-foreground font-body text-sm mt-2">
          Login or create an account to start playing
        </p>
        <div
          className="inline-block mt-4 px-4 py-2 rounded-full text-sm font-bold text-gold"
          style={{
            background: "oklch(0.17 0.06 42 / 0.4)",
            border: "1px solid oklch(0.35 0.1 42 / 0.5)",
          }}
        >
          🎁 ₹1,000 Welcome Bonus on Registration!
        </div>
      </motion.div>

      {/* Login / Register tabs */}
      <div className="px-4">
        <Tabs defaultValue="login">
          <TabsList
            className="grid grid-cols-2 w-full"
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
              Register
            </TabsTrigger>
          </TabsList>

          {/* Login */}
          <TabsContent value="login" className="mt-4">
            <div
              className="p-5 rounded-xl space-y-4"
              style={{
                background: "oklch(0.13 0.005 260)",
                border: "1px solid oklch(0.25 0.01 260)",
              }}
            >
              <p className="text-sm text-muted-foreground font-body text-center">
                Connect with Internet Identity to access your account securely
              </p>
              <Button
                className="w-full h-12 font-display font-black bg-fire hover:bg-fire/90 text-primary-foreground glow-fire"
                onClick={handleLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Connecting...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Login with Internet Identity
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground font-body">
                Secured by DFINITY Internet Identity · No password needed
              </p>
            </div>
          </TabsContent>

          {/* Register */}
          <TabsContent value="register" className="mt-4">
            <div
              className="p-5 rounded-xl space-y-4"
              style={{
                background: "oklch(0.13 0.005 260)",
                border: "1px solid oklch(0.25 0.01 260)",
              }}
            >
              {!isLoggedIn ? (
                <>
                  <p className="text-sm text-muted-foreground font-body text-center">
                    First, connect with Internet Identity, then fill in your
                    details
                  </p>
                  <Button
                    className="w-full h-12 font-display font-black bg-fire hover:bg-fire/90 text-primary-foreground glow-fire"
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Connect Internet Identity
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg"
                    style={{
                      background: "oklch(0.15 0.04 160 / 0.2)",
                      border: "1px solid oklch(0.4 0.1 160 / 0.3)",
                    }}
                  >
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-400 font-body">
                      Connected! Fill details to create account.
                    </span>
                  </div>

                  {[
                    {
                      label: "Full Name",
                      placeholder: "Your full name",
                      value: regName,
                      setter: setRegName,
                      type: "text",
                    },
                    {
                      label: "Phone Number",
                      placeholder: "10-digit mobile number",
                      value: regPhone,
                      setter: setRegPhone,
                      type: "tel",
                    },
                    {
                      label: "Password",
                      placeholder: "Min 6 characters",
                      value: regPassword,
                      setter: setRegPassword,
                      type: "password",
                    },
                  ].map(({ label, placeholder, value, setter, type }) => (
                    <div key={label} className="space-y-1.5">
                      <Label className="text-sm text-muted-foreground font-body">
                        {label}
                      </Label>
                      <Input
                        type={type}
                        className="bg-secondary/60 border-border/40 h-11"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                      />
                    </div>
                  ))}

                  <Button
                    className="w-full h-12 font-display font-black bg-fire hover:bg-fire/90 text-primary-foreground glow-fire"
                    onClick={handleRegister}
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Creating Account...
                      </>
                    ) : (
                      "Create Account & Get ₹1,000"
                    )}
                  </Button>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

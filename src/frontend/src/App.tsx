import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { BottomNav } from "./components/BottomNav";
import { AdminPage } from "./pages/AdminPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { PlayPage } from "./pages/PlayPage";
import { ProfilePage } from "./pages/ProfilePage";
import { WalletPage } from "./pages/WalletPage";

// Root layout
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen" style={{ background: "oklch(0.09 0 0)" }}>
      {/* Max-width container for desktop */}
      <div
        className="mx-auto max-w-[480px] min-h-screen relative"
        style={{ background: "oklch(0.09 0 0)" }}
      >
        <Outlet />
        <BottomNav />
      </div>
      {/* Desktop side decoration */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.11 0.005 260) 0%, oklch(0.06 0 0) 70%)",
        }}
      />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.16 0.005 260)",
            border: "1px solid oklch(0.28 0.015 50 / 0.4)",
            color: "oklch(0.96 0.01 95)",
            fontFamily: '"Sora", sans-serif',
            fontSize: "14px",
          },
        }}
      />
    </div>
  ),
});

// Routes
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const playRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/play",
  component: HomePage, // Shows game list to select from
});

const playGameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/play/$gameId",
  component: PlayPage,
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wallet",
  component: WalletPage,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: HistoryPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  playRoute,
  playGameRoute,
  walletRoute,
  historyRoute,
  profileRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}

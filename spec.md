# MatkaFun Live

## Current State
- Full login/registration system (phone+password, Google email, single-box "admin"/"user" login)
- Session tokens, user profiles stored in backend
- Wallet balance per user (fetched via session token)
- Withdrawal requires admin approval (approve/reject in admin panel)
- Game results shown from backend + seed fallback
- Clock: 7 hours behind real time (useMatkaTime hook)
- Market status (OPEN/RESULT SOON/CLOSED) computed from matka time vs game open/close times

## Requested Changes (Diff)

### Add
- Fixed local wallet of ₹10,000 (stored in localStorage, no backend needed)
- Auto-approve withdrawal: when user submits withdrawal, immediately mark as "approved" and deduct from local wallet
- Clock-based results: for games whose close time has passed (per matka time), show pre-seeded realistic results; games currently open or upcoming show "***-**-***"

### Modify
- Remove all login/session/profile/auth logic from frontend
- WalletPage: show fixed ₹10,000 wallet from localStorage (deducted on withdrawal), no session checks
- HomePage: remove "Welcome Bonus" banner, remove login prompts
- BottomNav: remove Profile tab and Admin tab (no login system)
- GameCard: results shown based on matka time — if game is CLOSED, show seed result; if OPEN or upcoming, show pending "***-**-***"
- AdminPage: keep for result management but remove session-based admin check; accessible directly via /admin URL

### Remove
- ProfilePage.tsx (entire login/profile system)
- All session token logic from useQueries.ts
- Login-required guards on wallet, history, bets
- Admin approval/reject buttons for withdrawals (auto-approved now)
- "Pehle login karein" messages everywhere

## Implementation Plan
1. Remove ProfilePage, simplify BottomNav (no Profile/Admin tabs)
2. Create useLocalWallet hook: localStorage wallet starting at ₹10,000, with deposit/withdraw functions
3. Update WalletPage: use useLocalWallet, withdrawal immediately deducts and shows "Approved" status in local history
4. Update HomePage: remove welcome bonus banner, remove login prompts
5. Update GameCard: results show based on matka clock — CLOSED games show seed result, OPEN/upcoming show "***"
6. Update seedGames.ts: ensure all 27 games have results in SEED_RESULTS
7. Remove session checks from all queries, simplify useQueries.ts
8. Keep AdminPage accessible at /admin (no login gate)

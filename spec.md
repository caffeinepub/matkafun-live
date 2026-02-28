# MatkaFun - Live Matka Results App

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Live matka results page showing all games (Morning/Day/Night sessions)
- Each game card shows: game name, open/close numbers, panel, jodi numbers
- IST clock displayed as IST-7 hours (i.e., 7 hours behind IST = effectively a custom timezone clock)
- Game schedule with timing for each game
- Wallet system with starting balance of Rs.1000 for new users
- Bet/play functionality: users can place bets on open number, jodi, panel
- Withdrawal system via UPI and Bank Account
- Admin panel to post/update matka results
- User registration/login with authorization
- Transaction history (deposits, bets, withdrawals)

### Modify
N/A

### Remove
N/A

## Implementation Plan

### Backend (Motoko)
1. User model: id, name, phone, walletBalance (default 1000), role (admin/user)
2. Game model: id, name, openTime, closeTime, openNumber, closeNumber, jodiNumber, panelOpen, panelClose, session (morning/day/night), date
3. Bet model: userId, gameId, betType (open/jodi/panel), number, amount, status, result
4. Transaction model: userId, type (credit/debit/withdrawal), amount, method (upi/bank), status, timestamp
5. Withdrawal request model: userId, amount, method, upiId/bankDetails, status
6. Backend APIs:
   - getGames, getGameById, updateGameResult (admin)
   - getUserProfile, getWalletBalance
   - placeBet, getBetHistory
   - requestWithdrawal, getWithdrawals (admin approve/reject)
   - getTransactions
   - createUser (register), login

### Frontend
1. Home screen: custom clock (7 hours behind IST), list of all matka games with results
2. Each game card: name, session badge, open/close time, open number, jodi, panel, "Jodi Chart" and "Panel Chart" links
3. Play/Bet screen: select game, choose bet type (open/jodi/panel), enter number and amount, confirm
4. Wallet screen: balance display, add money, withdrawal form (UPI/Bank)
5. Transaction history screen
6. Admin screen: post results for each game
7. Bottom navigation: Home, Play, Wallet, History, Profile
8. Dark themed UI matching the reference screenshot (dark background, colored numbers)

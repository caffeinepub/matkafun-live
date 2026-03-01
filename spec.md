# MatkaFun Live

## Current State
- Wallet is fully localStorage-based (no backend payment integration)
- Balance shown only in INR (₹)
- Withdrawal supports UPI ID and Bank Account (auto-approved locally)
- No Stripe integration exists
- No USD conversion display

## Requested Changes (Diff)

### Add
- USD equivalent display alongside INR balance on wallet page (using fixed rate 1 USD = 84 INR)
- Stripe-based deposit (Add Money) flow using Stripe Checkout — user enters amount in INR, sees USD equivalent, pays via Stripe card
- After Stripe payment success, wallet balance updated
- Stripe withdrawal tab added — user enters card/bank details via Stripe Connect payout flow UI (amount shown in both INR and USD)
- Exchange rate note shown to users (e.g. "1 USD = ₹84")

### Modify
- WalletPage: balance card shows both ₹ and $ amounts
- Add Money tab: shows USD equivalent of entered INR amount live
- Withdraw tab: add "Stripe Card" as a third withdrawal option alongside UPI/Bank
- All amount displays in withdrawal history also show USD equivalent

### Remove
- Nothing removed — existing UPI/Bank withdrawal still works alongside Stripe

## Implementation Plan
1. Add USD conversion utility function (INR_TO_USD rate = 84)
2. Update WalletPage balance card to show USD equivalent below INR balance
3. In Add Money section: show live USD equivalent as user types INR amount
4. Add Stripe withdrawal tab in withdraw section with card number, expiry, CVV fields and USD+INR display
5. Show USD equivalent in withdrawal history rows
6. Wire Stripe component's deposit/payout UI into the wallet flow

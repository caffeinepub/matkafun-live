# MatkaFun Live

## Current State
- Phone number + password based login/registration system
- Session tokens stored in localStorage
- Admin check via `isAdminCheck(token)` backend call
- ProfilePage shows login/register tabs

## Requested Changes (Diff)

### Add
- Google-style login flow: user enters their Google email address to sign in (simulated OAuth - no real Google API needed)
- On first login with a new Google email, auto-register and show registration completion form (name input)
- Role selection dialog shown at login time: user picks "Admin" or "User" role
- Admin role requires a secret admin code (hardcoded "MATKA2024") to verify
- Backend: `loginWithGoogle(email, name)` function that creates/retrieves user by Google email
- Backend: `isAdminByEmail(email)` stored per-user flag

### Modify
- ProfilePage: replace phone/password tabs with Google login button + email input flow
- Login flow: after Google email entered -> show role selection dialog -> if admin, ask for admin code -> complete login
- Backend user model: add `googleEmail` field, make phone optional
- Registration: auto-generate phone placeholder from email hash if no phone

### Remove
- Phone number based login (useLogin with phone/password mutation)
- useRegister with phone/password
- Password fields from login/registration UI

## Implementation Plan
1. Update backend main.mo to add Google email auth:
   - New `loginWithGoogle(email: Text, name: Text, wantsAdmin: Bool, adminCode: Text)` function
   - Returns session token on success
   - Auto-creates user on first login with Rs.1000 bonus
   - Admin code check: if wantsAdmin=true, verify adminCode=="MATKA2024", then grant admin role
2. Update useQueries.ts:
   - Add `useGoogleLogin` mutation that calls `loginWithGoogle`
   - Keep session token pattern the same
3. Rewrite ProfilePage login section:
   - Step 1: "Google se Login" button -> show email input
   - Step 2: Role selection dialog (Admin / User cards)
   - Step 3: If Admin selected, show admin code input
   - Step 4: Complete login, show success
4. Keep logged-in profile view unchanged

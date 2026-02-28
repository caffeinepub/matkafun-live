# MatkaFun Live

## Current State
- Registration requires Internet Identity (DFINITY's secure auth) which is complex for users
- Users get "Account registration failed" error repeatedly
- Login flow shows Internet Identity popup which confuses users
- Backend register() function tied to Principal (Internet Identity)

## Requested Changes (Diff)

### Add
- Simple phone+password based login system (no Internet Identity required)
- Guest/anonymous principal for all users - use phone number as unique key
- Backend: phoneLogin() function that creates or returns a user by phone+password
- Frontend: Simple login form with just phone + password fields
- Auto-login after registration (no separate login step)

### Modify
- Backend: register() to work with anonymous caller, keyed by phone number instead of Principal
- Backend: Authentication based on phone+password instead of Internet Identity
- Frontend ProfilePage: Replace Internet Identity login button with simple phone+password form
- Remove all Internet Identity references from the login/registration UI

### Remove
- Internet Identity login requirement
- useInternetIdentity hook dependency from registration flow
- "DFINITY Internet Identity se secured" messaging

## Implementation Plan
1. Update backend main.mo: Add phoneLogin(phone, password) -> session token or profile, register by phone key
2. Update frontend hooks: Replace II-based auth with phone-based auth using localStorage session
3. Update ProfilePage: Show simple phone+password form, auto-register new users or login existing ones
4. Remove Internet Identity shield icons and messaging from auth screens

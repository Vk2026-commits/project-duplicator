## Problem

After signup on the Faithnancial homepage, users are redirected to `https://budget.faithnancial.com` (a separate app on a different subdomain). Because Supabase sessions are scoped per origin, the session doesn't carry across subdomains — so users are prompted to sign in a second time on the Budget/Estate app.

## Fix

Keep new signups on the Faithnancial site so their session stays valid, and route them straight into the authenticated experience.

### Changes (frontend only, `src/pages/Home.tsx`)

1. In `handleSubmit`, after a successful `signUp`:
   - Remove `window.location.href = budgetAppUrl;`
   - Call `applySessionPreference()` so Remember-me / session persistence is respected (same as sign-in).
   - Honor a pending network invite if present, otherwise `navigate("/dashboard")` — matching the sign-in path.
2. Leave the ecosystem "Start Free Trial" buttons and Budget/Estate ecosystem links unchanged (those are intentional external navigations from marketing cards, not the signup flow).
3. Leave social OAuth (`redirect_uri` → `/dashboard`) unchanged; it already stays on this domain.

No backend, auth config, or route changes required.

### Result

Signup → account created → session active → user lands on `/dashboard` on `faithnancial.com`. No second login prompt.

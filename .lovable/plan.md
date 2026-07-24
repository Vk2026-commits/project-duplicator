
Got it — I'll do it all in this project. No Lovable Cloud, no remix, external Supabase hardcoded.

## Approach

Rip out the TanStack Start template and rebuild this project as a Vite + react-router-dom app that mirrors the source (`Investor Portal Pro`), then wire it to your external Supabase (`naduuuvpbvynwjsncgao`). Frontend only — I will not touch your Supabase database or deploy edge functions (I can't from here); any feature calling an edge function will fail until you deploy them to your Supabase yourself.

## Steps

1. **Strip TanStack Start template**
   - Delete: `src/router.tsx`, `src/server.ts`, `src/start.ts`, `src/routes/`, `src/routeTree.gen.ts`, `src/lib/lovable-error-reporting.ts`, `src/lib/error-capture.ts`, `src/lib/error-page.ts`.
   - Rewrite `vite.config.ts` for a plain Vite + React SPA (SWC plugin, `@` alias, port 8080).
   - Rewrite `index.html`, `package.json` (swap TanStack Start deps for `react-router-dom`, `@supabase/supabase-js`, all Radix + shadcn deps used by the source), `tsconfig.json`.
   - Replace `src/styles.css` (Tailwind v4) with the source's `src/index.css` + `tailwind.config.ts` + `postcss.config.js` (Tailwind v3, matching source).

2. **Copy source frontend verbatim**
   - Copy all files from source `src/`:
     - `src/App.tsx`, `src/main.tsx`, `src/App.css`, `src/index.css`, `src/vite-env.d.ts`
     - `src/pages/*` (21 files)
     - `src/components/*` (30 files) including `components/ui/*`
     - `src/hooks/*`
     - `src/lib/*`
     - `src/integrations/supabase/*` (client.ts + types.ts)
   - Skip `src/integrations/lovable/` and `src/test/`.
   - Copy source's `components.json`, `eslint.config.js`.

3. **Point Supabase at your external project**
   - Rewrite `src/integrations/supabase/client.ts` to hardcode:
     - URL: `https://naduuuvpbvynwjsncgao.supabase.co`
     - anon key: your pasted JWT
   - Remove any `import.meta.env.VITE_SUPABASE_*` references.
   - Grep the pasted code for any calls to `supabase.functions.invoke(...)` — leave them in place; they will hit your Supabase project's edge functions when you deploy them there.

4. **Handle Lovable integration import**
   - Search source for `@/integrations/lovable/*` or `@lovable.dev/cloud-auth-js` imports. If found (source `package.json` lists `@lovable.dev/cloud-auth-js`), replace those call sites with plain `supabase.auth.*` equivalents so nothing depends on Lovable Cloud auth.

5. **Install & verify build**
   - `bun install` (auto-restarts dev server).
   - Ensure home renders (the source's `/` is `Home`, so the blank-page placeholder is gone).
   - Fix any TS or import errors surfaced by the build.

## What you own after this

- Deploying the 40 migrations in the source's `supabase/migrations/` to your Supabase project (`supabase db push`).
- Deploying the 9 edge functions from `supabase/functions/` (`supabase functions deploy <name>`).
- Setting edge-function secrets and enabling auth providers in your Supabase dashboard.

Until you do that, pages that only read tables via RLS will load once the schema exists; anything invoking edge functions (email send, document URL signing, unsubscribe, compliance reminders, transactional email) will error.

## Not doing

- Not enabling Lovable Cloud.
- Not creating any TanStack Start routes/server functions.
- Not copying `supabase/` folder into this repo (nothing here can deploy it; you'll pull migrations/functions from the source project directly when you're ready).

Ready to execute on approval.
